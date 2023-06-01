import { BlockHandler, Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { type PublicClient, type Block, type Address } from "npm:viem";
import { Erc20Abi } from "../abis/erc20.ts";
import { StableSwapAbi } from "../abis/StableSwapAbi.ts";
import { Snapshot } from "../entities/snapshot.ts";
import { getGaugeStats, getPool, getPoolCount } from "./poolhelper.ts";
import { TokenPrice } from "./tokenprice.ts";
import { toNumber } from "./util.ts";

export const POOLS: { pool: Address, token: Address, gauge: Address }[] = [
	{ pool: '0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7', token: '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490', gauge: '0xbfcf63294ad7105dea65aa58f8ae5be2d9d0952a' }, // 3pool
	{ pool: '0xdcef968d416a41cdac0ed8702fac8128a64241a2', token: '0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC', gauge: '0xcfc25170633581bf896cb6cdee170e3e3aa59503' }, // frax/usdc
	{ pool: '0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca', token: '0xed279fdd11ca84beef15af5d39bb4d4bee23f0ca', gauge: '0x9b8519a9a00100720ccdc8a120fbed319ca47a14' }, // LUSDC/3Pool
	{ pool: '0xb30da2376f63de30b42dc055c93fa474f31330a5', token: '0xb30da2376f63de30b42dc055c93fa474f31330a5', gauge: '0x740ba8aa0052e07b925908b380248cb03f3de5cb' }, // alUSDFRAXBP
	{ pool: '0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c', token: '0x43b4fdfd4ff969587185cdb6f0bd875c5fc83f8c', gauge: '0x9582c4adacb3bce56fea3e590f05c3ca2fb9c477' }, // alusd/3pool
]

const HOUR = 60 * 60
const nearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
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
		if (await getPoolCount() === 0) {
			await Promise.all(POOLS.map(info => getPool(client, info.pool, info.token))) // hack to make sure all pools exist
		}
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
			const prices = await Promise.all(pool.tokens.map((token) =>  TokenPrice.get(client, block.number!, token.address)))
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