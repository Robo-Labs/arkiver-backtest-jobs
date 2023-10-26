import { type PublicClient, type Address, type Block } from "npm:viem";
import { Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { CrvTokenAbi } from "../abis/crvToken.ts";
import { Erc20Abi } from "../abis/erc20.ts";
import { velodromeAbi } from "../abis/velodromeAbi.ts";
import { AmmPool } from "../entities/ammpool.ts";
import { Token } from "../entities/token.ts";
import { TokenPrice } from "./tokenprice.ts";
import { toNumber } from "./util.ts";
import { CamelotAbi } from "../abis/camelotAbi.ts";

export const getPoolFromToken = async (token: string) => {
	return (await AmmPool.findOne({ token }).populate('tokens'))
}
export const getCurvePools = async () => {
	return (await AmmPool.find({}).populate('tokens'))
}

export const getPoolFromSymbol = async (symbol: string) => {
	return (await AmmPool.findOne({ symbol }).populate('tokens'))!
}

export const getPoolCount = () => {
	return AmmPool.countDocuments()
}

const MKR = '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'
const MDT = '0x4Dfd148B532e934a2a26eA65689cf6268753e130'

export const getBlock = async (client: PublicClient, store: Store, blockNumber: bigint) => {
	return await store.retrieve(`block:${blockNumber}`, async () => await client.getBlock({ blockNumber }))
}

export const getPool = (client: PublicClient, store: Store, address: Address) => {
	return store.retrieve(`Univ3:Pool:${address}`, async () => {
		const record = await AmmPool.findOne({ address }).populate('tokens')
		if (record)
			return record

		const [token0, token1, tickSpacing] = await client.multicall({
			contracts: [
				{ abi: CamelotAbi, address, functionName: "token0" },
				{ abi: CamelotAbi, address, functionName: "token1" },
				{ abi: CamelotAbi, address: address, functionName: "tickSpacing" },
				//{ abi: CamelotAbi, address: address, functionName: "fee" }
			]
		})

		const network = client.chain!.name
		const tokens = await Promise.all([ token0, token1 ].map(token => getToken(client, network, token.result!)))
		//const fee = feeRaw.result! / 10000
		const fee = 0 // TODO
		const pool = new AmmPool({
			network,
			protocol: `Camelotv3`,
			address,
			symbol: `Camelotv3 ${tokens[0].symbol}/${tokens[1].symbol	} ${fee}%`,
			tokens: tokens,
			fee,
			tickSpacing: tickSpacing.result!

		})
		await pool.save()
		return pool
	})
}


export const getToken = async (client: PublicClient, network: string, address: Address) => {
	//console.log(`getting token: ${address}`)
	const record = await Token.findOne({ network, address })
	if (record)
		return record

	// MKR doesn't conform to the spec :(
	const getSymbol = async (address: Address) => {
		switch(address){
			case MKR:
				return 'MKR'
			case MDT:
				return 'MDT'
			default:
				try{
					return await client.readContract({ abi: Erc20Abi, address, functionName: "symbol" })
				} catch(e) {
					return "undefined"
				}
		}
		//return address == MKR ? 'MKR' : await client.readContract({ abi: Erc20Abi, address, functionName: "symbol" }) 
	}
	const [ symbol, decimals ] = await Promise.all([
		getSymbol(address),
		client.readContract({ abi: Erc20Abi, address, functionName: "decimals" }),
	])

	const token = new Token({
		address: address,
		symbol,
		network,
		decimals: Number(decimals)
	})
	await token.save()
	return token
}