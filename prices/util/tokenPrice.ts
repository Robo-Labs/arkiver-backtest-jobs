
import { type PublicClient, type Address } from "npm:viem";

import { toNumber } from "./util.ts";
import { Store } from "https://deno.land/x/robo_arkiver@v0.4.17/mod.ts";
import { EACAggregatorProxyAbi } from "../abis/eacAggregatorProxyAbi.ts";

const CLPriceRegistry = '0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf'
export const USD = "0x0000000000000000000000000000000000000348" // The ID for USD in the FeedRegistry


const CLMap: Record<string, Record<Address, Address>> = {	
	"optimism": {
		"0x7F5c764cBc14f9669B88837ca1490cCa17c31607": "0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3", // USDC
		"0x4200000000000000000000000000000000000006": "0x13e3Ee699D1909E989722E753853AE30b17e08c5", // WETH
		"0xc40F949F8a4e094D1b49a23ea9241D289B7b2819": "0x9dfc79Aaeb5bb0f96C6e9402671981CdFc424052"
	},
	"arbitrum one": {
		"0x82aF49447D8a07e3bd95BD0d56f35241523fBab1": "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612", // WETH
		"0x912CE59144191C1204E64559FE8253a0e49E6548": "0xb2A824043730FE05F3DA2efaFa1CBbe83fa548D6" // ARB
	},
} as const

const getAggAddress = (client: PublicClient, token: Address) => {
	const network = client.chain!.name.toLowerCase()
	const address = CLMap[network][token] as Address | undefined
	if (!address)
		throw new Error(`Unknown network ${network} or token ${token}`)
	return address
}

export class TokenPrice {

	static async get(client: PublicClient, store: Store, block: bigint, token: Address): Promise<number> {
		return await store.retrieve(`TokenPrice:${token}:${Number(block)}`, async () => {
			try {
				return await TokenPrice.getCLPrice(client, block, token)
			} catch(e) {
				return 0
			}
		})
	}

	static getPrices(client: PublicClient, store: Store, block: bigint, tokens: Address[]) {
    return TokenPrice.getCLPrices(client, block, tokens)
	}

	static async getCLPrice(client: PublicClient, block: bigint, token: Address) {
		const result = await client.readContract({
			abi: EACAggregatorProxyAbi,
			address: getAggAddress(client, token),
			functionName: "latestAnswer",
			blockNumber: block,
		})
		return toNumber(result as bigint, 8)
	}

	static async getCLPrices(client: PublicClient, block: bigint, tokens: Address[]) {
		const resp = (await client.multicall({
      contracts: tokens.map(token => { 
        return {
					abi: EACAggregatorProxyAbi,
					address: getAggAddress(client, token),
					functionName: "latestAnswer",
        }
      }),
      blockNumber: block,
		}))
		return resp.map(e => toNumber(e.result!, 8))
	}
}