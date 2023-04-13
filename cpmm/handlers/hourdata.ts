import { HourData } from "../entities/hourdata.ts"
import { TimeTracker } from "../entities/timeTracker.ts"
import { type PublicClient } from "npm:viem";
import { Store } from "../deps.ts";
import { AAVEPoolAbi } from "../abis/AAVEPool.ts";
import { CamelotMasterAbi } from "../abis/camelotMasterAbi.ts";
import { CamelotRouterAbi } from "../abis/camelotRouterAbi.ts";

const HOUR = 60 * 60
const nearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

const toNumber = (n: bigint, decimals: number) => {
	return Number(n) / (10 ** decimals)
}

const POOL = '0x794a61358D6845594F94dc1DB02A252b5b4814aD' as const
const GRAIL = '0x3d9907F9a368ad0a51Be60f7Da3b97cf940982D8' as const
const ETH = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const
const USDC = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' as const
const NFTPool = '0x6BC938abA940fB828D39Daa23A94dfc522120C11' as const
const CamelotMaster = '0x55401A4F396b3655f66bf6948A1A4DC61Dfc21f4' as const
const CamelotRouter = '0xc873fEcbd354f5A56E00E710B90EF4201db2448d' as const

export const processHourData = async (client: PublicClient, store: Store, timestamp: number, blockNumber: bigint) => {
	const nowHour = nearestHour(Number(timestamp))
	const id = 'hour'
	let status = await TimeTracker.findOne({ id })
	if (status === null) {
		status = new TimeTracker({ id, lastTimestamp: nowHour })
	}
	let lastHour = status.lastTimestamp

	console.log('hours')
	console.log(nowHour, lastHour, timestamp - lastHour)
	const hourDatas: typeof HourData[] = []
	if (nowHour > lastHour) {
		// we have data to populate
		while (lastHour < nowHour) {
			lastHour += HOUR

			const [
				usdcIncomeRateBn,
				ethDebtRateBn,
				poolInfo,
				amountsOut
			] = (await client.multicall({
				contracts: [
					{ address: POOL, abi: AAVEPoolAbi, functionName: 'getReserveNormalizedIncome', args: [USDC] },
					{ address: POOL, abi: AAVEPoolAbi, functionName: 'getReserveNormalizedVariableDebt', args: [ETH] },
					{ address: CamelotMaster, abi: CamelotMasterAbi, functionName: 'getPoolInfo', args: [NFTPool] },
					{ address: CamelotRouter, abi: CamelotRouterAbi, functionName: 'getAmountsOut', args: [10n ** 18n, [GRAIL, ETH, USDC]] },
				],
				blockNumber,
			})).map(e => e.result)
			
			const rewardsPerSecond = toNumber(poolInfo[4], 18)
			const rewardTokenPrice = toNumber(amountsOut[2], 6)
			const data = {
				id: `${lastHour}`,
				timestamp: lastHour,
				usdcIncomeRate: toNumber(usdcIncomeRateBn, 27),
				ethDebtRate: toNumber(ethDebtRateBn, 27),
				rewardsPerSecond,  // grail rewards
				rewardTokenPrice, // grail price
			}
			hourDatas.push(new HourData(data))

		}
	}

	status.lastTimestamp = lastHour
	await status.save()
	await HourData.bulkSave(hourDatas)
}