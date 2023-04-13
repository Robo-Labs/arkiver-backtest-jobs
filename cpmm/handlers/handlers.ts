import { EventHandlerFor } from "https://deno.land/x/robo_arkiver@v0.4.1/src/arkiver/types.ts";
import { LPAbi } from "../abis/lpabi.ts";
import { Sync } from "../entities/sync.ts";
import { processMinuteData, saveTotalSupply } from "./minutedata.ts";
import { processHourData } from "./hourdata.ts";

const ROUTER = '0xc873fEcbd354f5A56E00E710B90EF4201db2448d' as const
const ETH = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1' as const
const USDC = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8' as const

const toNumber = (n: bigint, decimals: number) => {
	return Number(n) / (10 ** decimals)
}

export const mintHandler: EventHandlerFor<typeof LPAbi, "Mint"> = async (
	{ event, client, store },
) => {
	const block = Number(event.blockNumber)
	await saveTotalSupply(client, block, store)
}
export const burnHandler: EventHandlerFor<typeof LPAbi, "Burn"> = async (
	{ event, client, store },
) => {
	const block = Number(event.blockNumber)
	await saveTotalSupply(client, block, store)
}

export const syncHandler: EventHandlerFor<typeof LPAbi, "Swap"> = async (
	{ event, client, store },
) => {
	const blockNumber = Number(event.blockNumber)
	console.log(`block-${blockNumber}`)
	const block = await store.retrieve(`block-${blockNumber}`, () => {
		return client.getBlock({ blockNumber: event.blockNumber })
	})
	const timestamp = Number(block.timestamp)	
	console.log('timestamp', timestamp)
	const txHash = event.transactionHash
	const txIndex = event.transactionIndex
	const data = {
		block: blockNumber,
		lp: event.address,
		timestamp,
		reserves0: toNumber(event.args.reserve0, 18),
		reserves1: toNumber(event.args.reserve1, 6),
	}
	const sync = new Sync({
		id: `${blockNumber}-${txHash}-${txIndex}`,
		...data,
	})

	await Promise.all([
		sync.save(),
		processMinuteData(client, store, timestamp, blockNumber),
	])
	processHourData(client, store, timestamp, event.blockNumber)

}

