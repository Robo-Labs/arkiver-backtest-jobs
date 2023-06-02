
import { type PublicClient, type Address } from "npm:viem";
import { Erc20Abi } from "../abis/erc20.ts";
import { FeedRegistryAbi } from "../abis/FeedRegistryAbi.ts";
import { StableSwapAbi } from "../abis/StableSwapAbi.ts";
import { Univ3QuoterAbi } from "../abis/Univ3Quoter.ts";
import { IAavePool } from "../entities/aavepool.ts";
import { ICurvePool } from "../entities/curvepool.ts";
import { getPools } from "./aavepools.ts";
import { getPoolFromToken } from "./poolhelper.ts";
import { toNumber } from "./util.ts";
import { Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { ethers } from "npm:ethers";

export const CLPriceRegistry = '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf'
const Univ3QuoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
export const USD = "0x0000000000000000000000000000000000000348" // The ID for USD in the FeedRegistry
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" // The ID for USD in the FeedRegistry

export class TokenPrice {

	static async get(client: PublicClient, store: Store, block: bigint, token: Address): Promise<number> {
		return await store.retrieve(`TokenPrice:${token}:${Number(block)}`, async () => {
			// check if it's a curve pool
			const curvePool = await getPoolFromToken(token)
			if (curvePool) {
				return await TokenPrice.getCurvePoolPrice(client, store, block, curvePool)
			}

			// Check if it's a aave pool
			const aavePools = await getPools(client)
			const aavePool = aavePools.find((e: IAavePool) => e.address === token)
			if (aavePool) {
				return await TokenPrice.getAavePoolPrice(client, block, aavePool)
			}

			try {
				return await TokenPrice.getCLPrice(client, block, token)
			} catch(e) {
				return await TokenPrice.getUniv3SpotPrice(client, block, token)
			}
		})
	}

	static async getUniv3SpotPrice(client: PublicClient, block: bigint, token: Address) {
		const { result } = await client.simulateContract({
			abi: Univ3QuoterAbi,
			address: Univ3QuoterAddress,
			functionName: "quoteExactInputSingle",
			args: [token, USDC, 3000, ethers.parseUnits('1', 18), 0],
			blockNumber: block,
		})
		return toNumber(result as bigint, 6)
	}

	static async getCLPrice(client: PublicClient, block: bigint, token: Address) {
		return toNumber((await client.readContract({
			abi: FeedRegistryAbi,
			address: CLPriceRegistry,
			functionName: "latestAnswer",
			args: [token as Address, USD],
			blockNumber: block,
		})), 8)
	}

	static async getCurvePoolPrice(client: PublicClient, store: Store, block: bigint, pool: ICurvePool) {
		// Get total supply and reserves
		const [ totalSupplyBigInt, ...reservesBigInt ] = (await Promise.all([
			client.readContract({
				abi: Erc20Abi,
				address: pool.token as Address,
				functionName: "totalSupply",
				blockNumber: block,
			}),
			...pool.tokens.map((token, i) => {
				return client.readContract({
					abi: StableSwapAbi,
					address: pool.address as Address,
					functionName: "balances",
					args: [BigInt(i)],
					blockNumber: block,
				})
			}),
		]))
		const totalSupply = toNumber(totalSupplyBigInt, 18)
		const reserves = reservesBigInt.map((e, i) => toNumber(e, pool.tokens[i].decimals))

		const prices = (await Promise.all(pool.tokens.map((token) => TokenPrice.get(client, store, block, token.address))))
		const lpValue = reserves.reduce((acc, reserve, i) => acc + (reserve * prices[i]!), 0)
		const price = lpValue / totalSupply
		return price
	}

	static async getAavePoolPrice(client: PublicClient, block: bigint, pool: IAavePool) {
		// AAVE tokens have a 1to1 with their underlying
		return await TokenPrice.getCLPrice(client, block, pool.underlying.address)
	}

}