import { type PublicClient, type Address } from "npm:viem";
import erc20 from "../abis/erc20.ts";
import { SolidlyPairAbi } from "../abis/solidlyPairAbi.ts";
import { IPair, Pair } from "../entities/pair.ts";
import { IToken, Token } from "../entities/token.ts";

export const getPairId = (client: PublicClient, pair: Address | string) => {
	return `${client.chain?.name}:${pair}`
}

export const getTokenId = (client: PublicClient, token: Address | string) => {
	return `${client.chain?.name}:${token}`
}

export const createPair = async (client: PublicClient, block: bigint, address: Address): Promise<IPair> => {
	// check if it's already in the db
	const pairId = getPairId(client, address)
	const record = await Pair.findOne({ id: pairId }).populate('token0 token1')
	if (record)
		return record
	

	// get the pair data
	const [token0, token1] = await client.readContract({
		address: address,
		abi: SolidlyPairAbi,
		functionName: 'tokens',
		blockNumber: block,
	})

	const [token0Doc, token1Doc] = await Promise.all([
		await createToken(client, token0),
		await createToken(client, token1),
	])

	const pair: IPair = {
		id: pairId,
		address: address as string,
		network: client.chain?.name as string,
		token0: token0Doc,
		token1: token1Doc,
	}

	await (new Pair(pair)).save()
	return pair
}


export const createToken = async (client: PublicClient, address: Address | string) => {
	// check if it's already in the db
	const id = getTokenId(client, address)
	const record = await Token.findOne({ id })
	if (record)
		return record

	// get the pair data.. todo, add symbol
	const decimals = await client.readContract({ 
		address: address as Address, 
		abi: erc20, 
		functionName: 'decimals',
	})
	const token: IToken = {
		id,
		address: address,
		network: client.chain?.name as string,
		decimals: Number(decimals)
	}
	const doc = new Token(token)
	await doc.save()
	return doc
}