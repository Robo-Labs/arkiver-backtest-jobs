import { BlockHandler, Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { type PublicClient, type Block } from "npm:viem";
import { AAVEPoolDataAbi } from "../abis/AAVEPoolDataAbi.ts";
import { AAVEHourData } from "../entities/aavehourdata.ts";
import { getPoolDataAddress, getPools } from "./entityutil.ts";

const HOUR = 60 * 60


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
	const last = await AAVEHourData.findOne({}).sort({ timestamp: -1 })
	const lastHour = last?.timestamp ?? (nearestHour(now) - HOUR)



	if (lastHour < nowHour) {
		const pools = await getPools(client, store, block.number!)
		const { poolData } = getPoolDataAddress(client)

		const records = await Promise.all(pools.map(async pool => {		  
			const [
				, // unbacked,
				, // accruedToTreasuryScaled,
				totalAToken,
				totalStableDebt, 
				totalVariableDebt,
				liquidityRate,
				variableBorrowRate,
				, // stableBorrowRate,
				, // averageStableBorrowRate,
				, // liquidityIndex,
				, // variableBorrowIndex,
				, // lastUpdateTimestamp,
			] = await client.readContract({
				address: poolData,
				abi: AAVEPoolDataAbi,
				functionName: 'getReserveData',
				args: [pool.underlying.address],
				blockNumber: block.number!,
			})

			return new AAVEHourData({
				timestamp: nowHour,
				pool: pool,
				underlying: pool.underlying,
				liquidityRate: toNumber(liquidityRate, 27),
				variableBorrowRate: toNumber(variableBorrowRate, 27),
				totalSupply: toNumber(totalAToken, pool.underlying.decimals),
				totalDebt: toNumber(totalStableDebt + totalVariableDebt, pool.underlying.decimals),
			})
		}))

		await AAVEHourData.bulkSave(records)
	}
}