import { BlockHandler, Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { type PublicClient, type Block, type Address } from "npm:viem";
import { Erc20Abi } from "../abis/erc20.ts";
import { Snapshot } from "../entities/snapshot.ts";
import { TokenPrice } from "./tokenprice.ts";
import { toNumber } from "./util.ts";
import { CamelotAbi } from "../abis/camelotAbi.ts";
import { AmmPool } from "../entities/ammpool.ts";
import { OhlcUtil } from "./ohlcutil.ts";
import { getPool, getPoolCount, getToken } from "./poolhelper.ts";

//const multicallAddress = '0x842eC2c7D803033Edf55E478F461FC547Bc54EB2'
const multicallAddress = '0xcA11bde05977b3631167028862bE2a173976CA11'
const HOUR = 60 * 60
const getNearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}
export const POOLS = [
	'0xb1026b8e7276e7ac75410f1fcbbe21796e8f7526',
  ]

export const hourDataHandler: BlockHandler = async ({ block, client, store }: {
	block: Block;
	client: PublicClient;
	store: Store;
}): Promise<void> => {
	client.batch = { multicall: true }
	
	const now = Number(block.timestamp)
	const nowHour = getNearestHour(Number(now)) - HOUR
	const last = await Snapshot.findOne({}).sort({ timestamp: -1 })
	const lastHour = last?.timestamp || nowHour - HOUR
	if (lastHour < nowHour) {
		if (await getPoolCount() === 0) {
			await Promise.all(POOLS.map(pool => getPool(client, store, pool))) // hack to make sure all pools exist
		}
		const pools = await AmmPool.find({}).populate('tokens')

		// deno-lint-ignore require-await
		const snaps = (await Promise.all(pools.map(async pool => {

			const ohlc = await OhlcUtil.getOrGapFill(client, store, nowHour, pool.address)
			if (!ohlc) {
				return null
			}

			const [
				feeGrowthGlobal0X128,
				feeGrowthGlobal1X128,
				totalValueLockedToken0,
				totalValueLockedToken1,
			] = await client.multicall({
				contracts: [
					{ abi: CamelotAbi, address: pool.address, functionName: "totalFeeGrowth0Token" },
					{ abi: CamelotAbi, address: pool.address, functionName: "totalFeeGrowth1Token" },
					{ abi: Erc20Abi, address: pool.tokens[0].address, functionName: "balanceOf", args: [pool.address] },
					{ abi: Erc20Abi, address: pool.tokens[1].address, functionName: "balanceOf", args: [pool.address] },
				],
				blockNumber: block.number!,
				multicallAddress,
			})

			const prices = await Promise.all(pool.tokens.map(token => {
				return TokenPrice.get(client, store, block.number!, token)
			}))

			const tvl0 = toNumber(totalValueLockedToken0.result!, pool.tokens[0].decimals)
			const tvl1 = toNumber(totalValueLockedToken1.result!, pool.tokens[1].decimals)
			const totalValueLockedUSD = prices[0] * tvl0 + prices[1] * tvl1

			return new Snapshot({
				pool,
				timestamp: nowHour,
				block: Number(block.number!),
				res: '1h',
				prices,
				sqrtPriceX96: ohlc.close,
				feeGrowthGlobal0X128: toNumber(feeGrowthGlobal0X128.result!, pool.tokens[0].decimals),
				feeGrowthGlobal1X128: toNumber(feeGrowthGlobal1X128.result!, pool.tokens[1].decimals),
				low: ohlc.low,
				high: ohlc.high,
				totalValueLockedUSD,
				totalValueLockedToken0: tvl0,
				totalValueLockedToken1: tvl1,
			})
			
		}))).filter(e => e !== null)
		await Snapshot.bulkSave(snaps as any)
	}

}