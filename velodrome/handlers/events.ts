
import { EventHandlerFor, Store } from "https://deno.land/x/robo_arkiver/mod.ts";
// import erc20 from "../abis/erc20.ts";
// import { Sync } from "../entities/sync.ts";
// import { TotalSupply } from "../entities/totalsupply.ts";
// import { type PublicClient, type Address } from "npm:viem";
// import { getPairId } from "./entityutil.ts";
// import { createPair } from "./entityutil.ts";
// import { SolidlyPairAbi } from "../abis/solidlyPairAbi.ts";
import { StableSwapAbi } from "../abis/StableSwapAbi.ts";
import { POOLS } from "./hourdata.ts";
import { getPool } from "./poolhelper.ts";


// event AddLiquidity:
//     provider: indexed(address)
//     token_amounts: uint256[N_COINS]
//     fees: uint256[N_COINS]
//     invariant: uint256
//     token_supply: uint256

// event RemoveLiquidity:
//     provider: indexed(address)
//     token_amounts: uint256[N_COINS]
//     fees: uint256[N_COINS]
//     token_supply: uint256

// event RemoveLiquidityOne:
//     provider: indexed(address)
//     token_amount: uint256
//     coin_amount: uint256

// event RemoveLiquidityImbalance:
//     provider: indexed(address)
//     token_amounts: uint256[N_COINS]
//     fees: uint256[N_COINS]
//     invariant: uint256
//     token_supply: uint256


// deno-lint-ignore require-await
export const addLiquidity: EventHandlerFor<typeof StableSwapAbi, "AddLiquidity"> = async (
	{ event, client, store },
) => {
	console.log('addLiquidity')
	console.log(event.address)
	console.log(event.args)

	const network = client.chain!.name
	const pool = await store.retrieve(`${network}:pool:${event.address}`, async () =>  { 
		return await getPool(client, event.address, POOLS.find(e => e.pool === event.address)!.token)
	})

	console.log(pool)
	await new Promise((resolve) => setTimeout(resolve, 10000))


}


// deno-lint-ignore require-awaitr
export const removeLiquidity: EventHandlerFor<typeof StableSwapAbi, "RemoveLiquidity"> = async (
	{ event, client, store },
) => {
	// console.log('RemoveLiquidity')
	// console.log(event.args)
}

// deno-lint-ignore require-await
export const removeLiquidityOne: EventHandlerFor<typeof StableSwapAbi, "RemoveLiquidityOne"> = async (
	{ event, client, store },
) => {
	// console.log('RemoveLiquidityOne')
	// console.log(event.args)
}

// deno-lint-ignore require-await
export const removeLiquidityImbalance: EventHandlerFor<typeof StableSwapAbi, "RemoveLiquidityImbalance"> = async (
	{ event, client, store },
) => {
	// console.log('RemoveLiquidityImbalance')
	// console.log(event.args)
}