import { BlockHandler, Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { type PublicClient, type Block, type Address } from "npm:viem";
import { Erc20Abi } from "../abis/erc20.ts";
import { velodromeAbi } from "../abis/velodromeAbi.ts";
import { Snapshot } from "../entities/snapshot.ts";
import { getPool, getPoolCount } from "./poolhelper.ts";
import { TokenPrice } from "./tokenprice.ts";
import { toNumber } from "./util.ts";

export const POOLS: { pool: Address, token: Address, stable: Boolean }[] = [
	{ pool: '0x207AddB05C548F262219f6bFC6e11c02d0f7fDbe', token: '0x207AddB05C548F262219f6bFC6e11c02d0f7fDbe', stable: true } // LUSD / USDC
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
			await Promise.all(POOLS.map(info => getPool(client, info.pool, info.stable, info.token))) // hack to make sure all pools exist
		}
		const records = await Promise.all(POOLS.map(async info => {
			const pool = await getPool(client, info.pool, info.stable, info.token)

			let [
				totalSupply,
				reservesBigInt
			] = await Promise.all([
				client.readContract({
					abi: Erc20Abi,
					address: info.token,
					functionName: "totalSupply",
					blockNumber: block.number!,
				}),
				client.readContract({
					abi: velodromeAbi,
					address: info.pool,
					functionName: "getReserves",
					blockNumber: block.number!,
				})
			])
			reservesBigInt.pop()
			const reserves = reservesBigInt.map((e, i) => toNumber(e, pool.tokens[i].decimals))
			const prices = await Promise.all(pool.tokens.map((token) =>  TokenPrice.get(client, store, block.number!, token.address)))
			//const gaugeStats = await getGaugeStats(client, store, block, pool.symbol)

			return new Snapshot({
				res: '1h',
				pool,
				block: Number(block.number),
				timestamp: nowHour,
				totalSupply: toNumber(totalSupply, 18),
				reserves,
				prices: prices
			})
		}))

		await Snapshot.bulkSave(records)
	}
}