import { EventHandlerFor, Store } from "https://deno.land/x/robo_arkiver@v0.4.7/mod.ts";
import erc20 from "../abis/erc20.ts";
import { Sync } from "../entities/sync.ts";
import { TotalSupply } from "../entities/totalsupply.ts";
import { type PublicClient, type Address } from "npm:viem";
import { getPairId } from "./entityutil.ts";
import { createPair } from "./entityutil.ts";
import { SolidlyPairAbi } from "../abis/solidlyPairAbi.ts";


export const saveTotalSupply = async (client: PublicClient, pair: Address, block: bigint, store: Store) => {
	const totalSupply = await store.retrieve(`timestamp:${client.chain?.name}:${block.toString()}`, async () => {
		return await client.readContract({
			address: pair,
			abi: erc20,
			functionName: 'totalSupply',
			blockNumber: block,
		})
	})
	const rec = new TotalSupply({
		network: client.chain?.name as string,
		pair,
		block: block.toString(),
		totalSupply: `0x${totalSupply.toString(16)}`,
	})
	rec.save()
}

export const mintHandler: EventHandlerFor<typeof SolidlyPairAbi, "Mint"> = async (
	{ event, client, store },
) => {
	await saveTotalSupply(client, event.address, event.blockNumber, store)
}
export const burnHandler: EventHandlerFor<typeof SolidlyPairAbi, "Burn"> = async (
	{ event, client, store },
) => {
	await saveTotalSupply(client, event.address, event.blockNumber, store)
}

export const syncHandler: EventHandlerFor<typeof SolidlyPairAbi, "Sync"> = async (
	{ event, client, store },
) => {
	// console.log('sync', event.blockNumber)
	// Fetch the pair info
	const pairId = getPairId(client, event.address)
	const pair = await store.retrieve(pairId, async () => {
		return await createPair(client, event.blockNumber, event.address)
	})

	// Fetch the timestamp
	const blockNumber = Number(event.blockNumber)
	const block = await store.retrieve(`block-${blockNumber}`, () => {
		return client.getBlock({ blockNumber: event.blockNumber })
	})
	const timestamp = Number(block.timestamp)	
	const sync = new Sync({
		block: blockNumber,
		timestamp,
		reserves0: `0x${event.args.reserve0.toString(16)}`,
		reserves1: `0x${event.args.reserve1.toString(16)}`,
		pairId,
		lp: pair,
	})
	await sync.save()
}

