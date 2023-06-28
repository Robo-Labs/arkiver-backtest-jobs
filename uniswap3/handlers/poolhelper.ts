import { type PublicClient, type Address, type Block } from "npm:viem";
import { Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { CrvTokenAbi } from "../abis/crvToken.ts";
import { Erc20Abi } from "../abis/erc20.ts";
import { velodromeAbi } from "../abis/velodromeAbi.ts";
import { AmmPool } from "../entities/ammpool.ts";
import { Token } from "../entities/token.ts";
import { TokenPrice } from "./tokenprice.ts";
import { toNumber } from "./util.ts";
import { UNI3PoolAbi } from "../abis/UNI3PoolAbi.ts";

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

export const getPool = async (client: PublicClient, address: Address, symbol: string) => {
	const record = await AmmPool.findOne({ address }).populate('tokens')
	if (record)
		return record

	const network = client.chain!.name
	const [token0, token1, tickSpacing, fee] = await Promise.all([
		client.readContract({
			abi: UNI3PoolAbi,
			address,
			functionName: "token0"
		}),
		client.readContract({
			abi: UNI3PoolAbi,
			address,
			functionName: "token1"
		}),
		client.readContract({
			abi: UNI3PoolAbi,
			address: address,
			functionName: "tickSpacing",
			args: []
		}),
		client.readContract({
			abi: UNI3PoolAbi,
			address: address,
			functionName: "fee",
			args: []
		})
	])
	const tokenAddresses = [token0, token1]
	console.log(`tokenAddresses: ${tokenAddresses}`)


	const tokens = await Promise.all(tokenAddresses.map(tokenAddress => {
			console.log(`here we lookup: ${tokenAddress}`)	
			return getToken(client, network, tokenAddress as Address)
		})
	)
	const pool = new AmmPool({
		network,
		protocol: `UNISWAP`,
		address,
		symbol,
		tokenSymbols: tokens.map(e => e.symbol),
		tokens: tokens,
		fee: fee,
		tickSpacing: tickSpacing

	})
	await pool.save()
	return pool
}


export const getToken = async (client: PublicClient, network: string, address: Address) => {
	console.log(`getting token: ${address}`)
	const record = await Token.findOne({ network, address })
	if (record)
		return record

	// MKR doesn't conform to the spec :(
	const getSymbol = async (address: Address) => {
		return address == MKR ? 'MKR' : await client.readContract({ abi: Erc20Abi, address, functionName: "symbol" }) 
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

export const getRewardRate = async (client: PublicClient, store: Store, block: Block, pool: string) => {
	const veloToken = '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05'
	const veloVoter = '0x09236cfF45047DBee6B921e00704bed6D6B8Cf7e'
	const gauge = await store.retrieve(`veloGauge:${pool}`, async () => {
		return await client.readContract({
			abi: VelodromeVoterAbi,
			address: veloVoter,
			functionName: 'gauges',
			args: [pool],
			blockNumber: block.number!,
		})
	})
	const rewardPerSecond = await client.readContract({
			abi: VelodromeGaugeAbi,
			address: gauge,
			functionName: 'rewardPerToken',
			args: [veloToken],
			blockNumber: block.number!,
		})
	return rewardPerSecond
	


	// const pool = await getPoolFromSymbol(symbol)
	// const blockNumber = Number(block.number!)
	// const [ crvRate, crvPrice, gaugeRelativeWeight, gaugeTotalSupply ] = (await Promise.all([
	// 	store.retrieve(`crvRate:${blockNumber}`, async () => {
	// 		return await client.readContract({
	// 			abi: CrvTokenAbi,
	// 			address: crvToken,
	// 			functionName: 'rate',
	// 			blockNumber: block.number!,
	// 		})
	// 	}),
	// 	store.retrieve(`crvPrice:${blockNumber}`, async () => {
	// 		return await TokenPrice.getCLPrice(client, block.number!, crvToken)
	// 	}),
	// 	client.readContract({
	// 		abi: CurveGaugeControllerAbi,
	// 		address: crvGaugeController,
	// 		functionName: 'gauge_relative_weight',
	// 		args: [pool.gauge as Address],
	// 		blockNumber: block.number!,
	// 	}),
	// 	client.readContract({
	// 		abi: Erc20Abi,
	// 		address: pool.gauge as Address,
	// 		functionName: 'totalSupply',
	// 		blockNumber: block.number!,
	// 	})
	// ]))

	// return {
	// 	crvRate: toNumber(crvRate, 18), 
	// 	crvPrice: crvPrice, 
	// 	gaugeRelativeWeight: toNumber(gaugeRelativeWeight, 18), 
	// 	gaugeTotalSupply: toNumber(gaugeTotalSupply, 18) 
	// }
}