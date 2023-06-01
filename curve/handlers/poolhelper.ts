import { type PublicClient, type Address, type Block } from "npm:viem";
import { Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { CrvTokenAbi } from "../abis/crvToken.ts";
import { Erc20Abi } from "../abis/erc20.ts";
import { StableSwapAbi } from "../abis/StableSwapAbi.ts";
import { CurvePool } from "../entities/curvepool.ts";
import { Token } from "../entities/token.ts";
import { CurveGaugeControllerAbi } from "../abis/curveGaugeController.ts";
import { TokenPrice } from "./tokenprice.ts";
import { toNumber } from "./util.ts";

export const getPoolFromToken = async (token: string) => {
	return (await CurvePool.findOne({ token }).populate('tokens'))
}
export const getCurvePools = async () => {
	return (await CurvePool.find({}).populate('tokens'))
}

export const getPoolFromSymbol = async (symbol: string) => {
	return (await CurvePool.findOne({ symbol }).populate('tokens'))!
}

export const getPoolCount = () => {
	return CurvePool.countDocuments()
}

const MKR = '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2'

export const getPool = async (client: PublicClient, address: Address, tokenAddress?: Address) => {
	const record = await CurvePool.findOne({ address }).populate('tokens')
	if (record)
		return record

	const network = client.chain!.name
	let exit = false
	let tokenAddresses: Address[] = []
	while (!exit) {
		try {
			const token = await client.readContract({
				abi: StableSwapAbi,
				address,
				functionName: "coins",
				args: [BigInt(tokenAddresses.length)],
			})
			tokenAddresses.push(token)
		} catch (error) {
			exit = true
		}
	}

	const symbol = await client.readContract({
		abi: Erc20Abi,
		address: tokenAddress as Address,
		functionName: "symbol",
	})

	const tokens = await Promise.all(tokenAddresses.map(address => getToken(client, network, address)))
	const pool = new CurvePool({
		network,
		address,
		symbol,
		token: tokenAddress,
		tokenSymbols: tokens.map(e => e.symbol),
		tokens: tokens
	})
	await pool.save()
	return pool
}


export const getToken = async (client: PublicClient, network: string, address: Address) => {
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

export const getGaugeStats = async (client: PublicClient, store: Store, block: Block, symbol: string) => {
	const crvToken = '0xD533a949740bb3306d119CC777fa900bA034cd52'
	const crvGaugeController = '0x2F50D538606Fa9EDD2B11E2446BEb18C9D5846bB'
	const pool = await getPoolFromSymbol(symbol)
	const blockNumber = Number(block.number!)
	const [ crvRate, crvPrice, gaugeRelativeWeight, gaugeTotalSupply ] = (await Promise.all([
		store.retrieve(`crvRate:${blockNumber}`, async () => {
			return await client.readContract({
				abi: CrvTokenAbi,
				address: crvToken,
				functionName: 'rate',
				blockNumber: block.number!,
			})
		}),
		store.retrieve(`crvPrice:${blockNumber}`, async () => {
			return await TokenPrice.getCLPrice(client, block.number!, crvToken)
		}),
		client.readContract({
			abi: CurveGaugeControllerAbi,
			address: crvGaugeController,
			functionName: 'gauge_relative_weight',
			args: [pool.gauge as Address],
			blockNumber: block.number!,
		}),
		client.readContract({
			abi: Erc20Abi,
			address: pool.gauge as Address,
			functionName: 'totalSupply',
			blockNumber: block.number!,
		})
	]))

	return {
		crvRate: toNumber(crvRate, 18), 
		crvPrice: crvPrice, 
		gaugeRelativeWeight: toNumber(gaugeRelativeWeight, 18), 
		gaugeTotalSupply: toNumber(gaugeTotalSupply, 18) 
	}
}