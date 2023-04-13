import { TimeTracker } from "../entities/timeTracker.ts"
import { type PublicClient } from "npm:viem";
import { Store } from "../deps.ts";
import { MinuteData } from "../entities/minutedata.ts";
import { Sync } from "../entities/sync.ts";
import erc20 from '../abis/erc20.ts'
import { TotalSupply } from "../entities/totalsupply.ts";

const PAIR = '0x84652bb2539513BAf36e225c930Fdd8eaa63CE27' as const // USDC/ETH

const nearestMinute = (now: number) => {
	return Math.floor(now / 60) * 60
}

export const saveTotalSupply = async (client: PublicClient, block: number, store: Store) => {
	const totalSupply = await store.retrieve(`totalSupply-${block}`, async () => {
		return Number(await client.readContract({
			address: PAIR,
			abi: erc20,
			functionName: 'totalSupply',
			blockNumber: block,
		}))
	})
	await (new TotalSupply({ id: `${block}`, block, totalSupply })).save()
	return totalSupply
}

const getTotalSupply = async (client: PublicClient, block: number, store: Store) => {
	const supply = await TotalSupply.findOne({}).sort({ block: -1 }).exec()
	if (supply) 
		return supply.totalSupply
	
	return await saveTotalSupply(client, block, store)
}

export const processMinuteData = async (client: PublicClient, store: Store, timestamp: number, blockNumber: number, ) => {
	const nowMinute = nearestMinute(Number(timestamp))
	const id = 'minute'
	let status = await TimeTracker.findOne({ id })
	if (status === null) {
		status = new TimeTracker({ id, lastTimestamp: nowMinute })
	}
	let lastMinute = status.lastTimestamp

	const minuteDatas: typeof MinuteData[] = []
	if (nowMinute > lastMinute) {
		// we have data to populate
		while (lastMinute < nowMinute) {
			lastMinute += 60
			const totalSupply = await getTotalSupply(client, blockNumber, store)
			const sync = await Sync.findOne({ timestamp: { $lt: lastMinute } }).sort({ timestamp: -1 }).exec()
			if (!sync)
				continue

			minuteDatas.push(new MinuteData({
				id: `${lastMinute}`,
				timestamp: lastMinute,
				totalSupply,
				reserves0: sync.reserves0,
				reserves1: sync.reserves1,
			}))
		}
	}

	status.lastTimestamp = lastMinute
	await status.save()
	await MinuteData.bulkSave(minuteDatas)
}