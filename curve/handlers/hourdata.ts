import { BlockHandler, Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { type PublicClient, type Block, type Address } from "npm:viem";
import { Erc20Abi } from "../abis/erc20.ts";
import { FeedRegistryAbi } from "../abis/FeedRegistryAbi.ts";
import { StableSwapAbi } from "../abis/StableSwapAbi.ts";
import { Snapshot } from "../entities/snapshot.ts";
import { getGaugeStats, getPool, getPoolTokenPrice } from "./poolhelper.ts";

const HOUR = 60 * 60
export const CLPriceRegistry = '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf'
export const USD = "0x0000000000000000000000000000000000000348" // The ID for USD in the FeedRegistry
const pool3crv = "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490" // The ID for USD in the FeedRegistry
export const POOLS: { pool: Address, token: Address, gauge: Address }[] = [
	{ pool: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', token: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490', gauge: '0xbfcf63294ad7105dea65aa58f8ae5be2d9d0952a' }, 
	{ pool: '0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca', token: '0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca', gauge: '0x9b8519a9a00100720ccdc8a120fbed319ca47a14' },
]

const nearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

const toNumber = (n: bigint, decimals: number = 0) => {
	return Number(n) / (10 ** decimals)
}

export const hourDataHandler: BlockHandler = async ({ block, client, store }: {
	block: Block;
	client: PublicClient;
	store: Store;
}): Promise<void> => {
	const now = Number(block.timestamp)
	const nowHour = nearestHour(Number(now))
	const last = await Snapshot.findOne({}).sort({ timestamp: -1 })
	const lastHour = last?.timestamp ?? (nearestHour(now) - HOUR)

	if (lastHour < nowHour) {
		await Promise.all(POOLS.map(info => getPool(client, info.pool, info.token))) // hack to make sure all pools exist
		const records = await Promise.all(POOLS.map(async info => {
			const pool = await getPool(client, info.pool, info.token)

			if (!pool.gauge) {
				pool.gauge = info.gauge
				await pool.save()
			}

			const [
				totalSupply,
				virtualPrice,
				...reservesBigInt
			] = await Promise.all([
				client.readContract({
					abi: Erc20Abi,
					address: info.token,
					functionName: "totalSupply",
					blockNumber: block.number!,
				}),
				client.readContract({
					abi: StableSwapAbi,
					address: info.pool,
					functionName: "get_virtual_price",
					blockNumber: block.number!,
				}),
				...pool.tokens.map((token, i) => {
					return client.readContract({
						abi: StableSwapAbi,
						address: info.pool,
						functionName: "balances",
						args: [BigInt(i)],
						blockNumber: block.number!,
					})
				}),
			])
			const reserves = reservesBigInt.map((e, i) => toNumber(e, pool.tokens[i].decimals))

			const prices = await Promise.all(pool.tokens.map(async (token) => {
				if (token.address === pool3crv) {
					return await getPoolTokenPrice(client, block, token.symbol)
				}

				const price = await client.readContract({
					abi: FeedRegistryAbi,
					address: CLPriceRegistry,
					functionName: "latestAnswer",
					args: [token.address, USD],
					blockNumber: block.number!,
				})
				return toNumber(price, 8)
			}))
			const gaugeStats = await getGaugeStats(client, store, block, pool.symbol)

			return new Snapshot({
				res: '1h',
				pool,
				block: Number(block.number),
				timestamp: nowHour,
				totalSupply: toNumber(totalSupply, 18),
				reserves,
				prices: prices,
				virtualPrice: toNumber(virtualPrice, 18),
				...gaugeStats,
			})
		}))

		await Snapshot.bulkSave(records)
	}
}