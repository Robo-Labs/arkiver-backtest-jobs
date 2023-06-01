
import { type PublicClient, type Address } from "npm:viem";
import { Erc20Abi } from "../abis/erc20.ts";
import { FeedRegistryAbi } from "../abis/FeedRegistryAbi.ts";
import { StableSwapAbi } from "../abis/StableSwapAbi.ts";
import { IAavePool } from "../entities/aavepool.ts";
import { ICurvePool } from "../entities/curvepool.ts";
import { getPools } from "./aavepools.ts";
import { getPoolFromToken } from "./poolhelper.ts";
import { toNumber } from "./util.ts";

export const CLPriceRegistry = '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf'
export const USD = "0x0000000000000000000000000000000000000348" // The ID for USD in the FeedRegistry
const pool3crv = "0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490" // The ID for USD in the FeedRegistry

export class TokenPrice {

	static async get(client: PublicClient, block: bigint, token: Address) {
		// check if it's a curve pool
		const curvePool = await getPoolFromToken(token)
		if (curvePool) {
			return await TokenPrice.getCurvePoolPrice(client, block, curvePool)
		}

		// Check if it's a aave pool
		const aavePools = await getPools(client)
		const aavePool = aavePools.find((e: IAavePool) => e.address === token)
		if (aavePool) {
			return await TokenPrice.getAavePoolPrice(client, block, aavePool)
		}

		// Try for chainlink
		return await TokenPrice.getCLPrice(client, block, token)
	}

	static async getCLPrice(client: PublicClient, block: bigint, address: string) {
		return toNumber((await client.readContract({
			abi: FeedRegistryAbi,
			address: CLPriceRegistry,
			functionName: "latestAnswer",
			args: [address as Address, USD],
			blockNumber: block,
		})), 8)
	}

	static async getCurvePoolPrice(client: PublicClient, block: bigint, pool: ICurvePool) {
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

		const prices = (await Promise.all(pool.tokens.map((token) => TokenPrice.getCLPrice(client, block, token.address))))
		const lpValue = reserves.reduce((acc, reserve, i) => acc + (reserve * prices[i]!), 0)
		const price = lpValue / totalSupply
		return price
	}

	static async getAavePoolPrice(client: PublicClient, block: bigint, pool: IAavePool) {
		// AAVE tokens have a 1to1 with their underlying
		return await TokenPrice.getCLPrice(client, block, pool.underlying.address)
	}

}