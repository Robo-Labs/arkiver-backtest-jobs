
import { type PublicClient, type Address } from "npm:viem";
import { Erc20Abi } from "../abis/erc20.ts";
import { FeedRegistryAbi } from "../abis/FeedRegistryAbi.ts";
import { EACAggregatorProxy } from "../abis/EACAggregatorProxy.ts"
import { velodromeAbi } from "../abis/velodromeAbi.ts";
import { VelodromeRouterAbi } from "../abis/VelodromeRouter.ts";
import { Univ3QuoterAbi } from "../abis/Univ3Quoter.ts";
import { UNIV2PairAbi } from "../abis/UNIV2PairAbi.ts";
import { IToken } from "../entities/token.ts";
import { toNumber } from "./util.ts";
import { Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { ethers } from "npm:ethers";

export const CLPriceRegistry = '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf'
const Univ3QuoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'
export const USD = "0x0000000000000000000000000000000000000348" // The ID for USD in the FeedRegistry
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const LUSD = "0x5f98805A4E8be255a32880FDeC7F6728C6568bA0"
const CLMap = {	
	"optimism": {
		"0x7F5c764cBc14f9669B88837ca1490cCa17c31607": "0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3", //USDC
		"0x4200000000000000000000000000000000000006": "0x13e3Ee699D1909E989722E753853AE30b17e08c5", //WETH
		"0xc40F949F8a4e094D1b49a23ea9241D289B7b2819": "0x9dfc79Aaeb5bb0f96C6e9402671981CdFc424052"
	},
	"ethereum": {
		"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6", //USDC
		"0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419", //WETH
	},
	"arbitrum one": {
		"0xaf88d065e77c8cC2239327C5EDb3A432268e5831": "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3", // USDC
		"0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612" // WETH
	}
}

const UNIV2Map = {"0x5f98805A4E8be255a32880FDeC7F6728C6568bA0": "0xF20EF17b889b437C151eB5bA15A47bFc62bfF469"}

export class TokenPrice {
	static async get(client: PublicClient, store: Store, block: bigint, token: any): Promise<number> {
		return await store.retrieve(`TokenPrice:${token.address}:${Number(block)}`, async () => {
			try {
				return await TokenPrice.getCLPrice(client, block, token.address)
				
			} catch(e) {
				console.log(e)
				return 0
			}
		})
	}

	static async getUniv3SpotPrice(client: PublicClient, store: Store, block: bigint, token: Address) {
		const { result } = await client.simulateContract({
			abi: Univ3QuoterAbi,
			address: Univ3QuoterAddress,
			functionName: "quoteExactInputSingle",
			args: [token, USDC, 500, ethers.parseUnits('1', 18), 0],
			blockNumber: block,
		})
		return toNumber(result as bigint, 6)
	}

	static async getUniv2SpotPrice(client: PublicClient, store: Store, block: bigint, token: Address) {
		if(!UNIV2Map[token]){
			console.log("failed to fetch V2 map")
			throw('failed to fetch V2 map')
		}
		console.log(`UNIV2Map[token]: ${UNIV2Map[token]}`)
		const { result } = await client.simulateContract({
			abi: UNIV2PairAbi,
			address: UNIV2Map[token],
			functionName: "getReserves",
			blockNumber: block,
		})
		const token0 = toNumber(result[0], 18) //TODO We need to get decimals from caller
		const token1 = toNumber(result[1], 18)
		const price = token1/token0
		const priceWeth = await store.retrieve(`${block}:${WETH}:CLprice`, async () => {
			return await TokenPrice.getCLPrice(client, block, WETH)
		})
		const priceToken = price*priceWeth
		return priceToken
		///return toNumber(result as bigint, 6)
	}


	static async getVelodromeSpotPrice(client: PublicClient, block: bigint, token: any) {
		const VELODROME_ROUTER = "0x9c12939390052919aF3155f41Bf4160Fd3666A6f"
		const swapAmount = 10 ** token.decimals
		const amountOut = await client.readContract({
			abi: VelodromeRouterAbi,
			address: VELODROME_ROUTER,
			functionName: "getAmountOut",
			args: [swapAmount, token.address, USDC ],
			blockNumber: block,
		})

		return toNumber(amountOut[0], 6)
	}

	static async getCLPrice(client: PublicClient, block: bigint, token: Address) {
		const result = await client.readContract({
			abi: EACAggregatorProxy,
			address: CLMap[client.chain.name.toLowerCase()][token],
			functionName: "latestAnswer",
			blockNumber: block,
		})
		return toNumber(result as bigint, 8)
	}

	static async getPoolPrice(client: PublicClient, store: Store, block: bigint, pool: ICurvePool) {
		// Get total supply and reserves
		const [
			totalSupply,
			reservesBigInt
		] = await Promise.all([
			client.readContract({
				abi: Erc20Abi,
				address: info.token,
				functionName: "totalSupply",
				blockNumber: block.number!,
			}),
			client.readContract({
				abi: velodromeAbi,
				address: info.pool,
				functionName: "getReserves",
				blockNumber: block.number!,
			})
		])
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