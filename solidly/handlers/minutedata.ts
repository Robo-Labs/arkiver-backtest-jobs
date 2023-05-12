import { BlockHandler, } from "https://deno.land/x/robo_arkiver/src/arkiver/types.ts";
import { TimeTracker } from "../entities/timeTracker.ts"
import { type PublicClient, type Block } from "npm:viem";
import { Store } from "../deps.ts";
import { MinuteData } from "../entities/minutedata.ts";
import { Sync } from "../entities/sync.ts";
import { TotalSupply } from "../entities/totalsupply.ts";
import { Pair, PairType } from "../entities/pair.ts";
import { getPairId } from "./entityutil.ts";

const nearestMinute = (now: number) => {
	return Math.floor(now / 60) * 60
}
const toNumber = (n: bigint, decimals: number) => {
	return Number(n) / (10 ** decimals)
}
const ONE_MINUTE = 60

const getTotalSupply = async (block: number) => {
	const supply = await TotalSupply.findOne({}).where('block').lt(block).sort({ block: -1 })
	if (supply) 
		return supply.totalSupply
	
	return supply
}

// deno-lint-ignore require-await
export const minuteDataHandler: BlockHandler = async ({ block, client, store }: {
	block: Block;
	client: PublicClient;
	store: Store;
}): Promise<void> => {
	processMinuteData(client, store, Number(block.timestamp), Number(block.number))
}	

export const processMinuteData = async (client: PublicClient, store: Store, timestamp: number, blockNumber: number) => {
	const nowMinute = nearestMinute(Number(timestamp))
	const id = 'minute'
	let status = await TimeTracker.findOne({ id })
	if (status === null) {
		status = new TimeTracker({ id, lastTimestamp: nowMinute })
	}
	let lastMinute = status.lastTimestamp

	// Get pairs from the db

	let minuteDatas: any[] = []
	if (nowMinute > lastMinute) {
		const pairs = await Pair.find({}).populate('token0 token1').exec()
		console.log()
		// we have data to populate
		while (lastMinute < nowMinute) {
			console.log('minute passed!')
			lastMinute += ONE_MINUTE

			const getSyncAndSupply = async (pair: PairType) => {
				const sync = await Sync.findOne({ timestamp: { $lt: lastMinute }, pairId: getPairId(client, pair.address) }).sort({ timestamp: -1 }).exec()
				if (!sync)
					return null
				const totalSupply = await getTotalSupply(blockNumber)
				if (!totalSupply)
					return null
				return { 
					pair,
					totalSupply: BigInt(totalSupply), 
					reserves0: BigInt(sync.reserves0), 
					reserves1: BigInt(sync.reserves1),
					decimals0: pair.token0.decimals,
					decimals1: pair.token1.decimals,
				}
			}

			const datas = (await Promise.all(pairs.map(async pair => await getSyncAndSupply(pair)))).filter(e => e !== null)
				.map((e: any) => {
				const { totalSupply, reserves0, reserves1, decimals0, decimals1, pair } = e
				const data = {
					id: `${client.chain?.name}:${pair.address}:${lastMinute}`,
					address: pair.address,
					pair,
					timestamp: lastMinute,
					totalSupply: toNumber(totalSupply, 18),
					reserves0: toNumber(reserves0, decimals0),
					reserves1: toNumber(reserves1, decimals1)
				}
				return new MinuteData(data)
			})

			minuteDatas = [...minuteDatas, ...datas]
		}
	}
	status.lastTimestamp = lastMinute
	await status.save()
	await MinuteData.bulkSave(minuteDatas)

	// Delete old sync data we no longer need it
	Sync.deleteMany({ timestamp: { $lt: lastMinute } }).exec()
}