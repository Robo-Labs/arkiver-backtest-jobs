import { type PublicClient, type Address } from "npm:viem";
import erc20 from "../abis/erc20.ts";
import { Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { IToken, Token } from "../entities/token.ts";
import { Pool } from "../entities/pool.ts";
import { AAVEPoolAbi } from "../abis/AAVEPoolAbi.ts";

export const getPairId = (client: PublicClient, pair: Address | string) => {
	return `${client.chain?.name}:${pair}`
}

export const AavePool: {[key: string]: Address } = {
	'optimism': '0x794a61358D6845594F94dc1DB02A252b5b4814aD'
}

export const AavePoolData: {[key: string]: Address } = {
	'optimism': '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654'
}

export const getTokenId = (client: PublicClient, token: Address | string) => {
	return `${client.chain?.name}:${token}`
}
export const getPoolAddress = (client: PublicClient) => {
	if (!client.chain)
		throw new Error('Chain must be specified')
	const network = client.chain.name.toLocaleLowerCase()
	const pool = AavePool[network]
	if (!pool)
		throw new Error('Unknown Pool for network: ' + network)
	return {pool, network}
}
export const getPoolDataAddress = (client: PublicClient) => {
	if (!client.chain)
		throw new Error('Chain must be specified')
	const network = client.chain.name.toLocaleLowerCase()
	const poolData = AavePoolData[network]
	if (!poolData)
		throw new Error('Unknown Pool for network: ' + network)
	return {poolData, network}
}

export const getPools = async (client: PublicClient, store: Store, block: bigint) => {
	const {pool, network} = getPoolAddress(client)

	return await store.retrieve(`${network}:AAVE Pools`, async () => {
		const records = await Pool.find({ network }).populate('underlying')
		if (records.length > 0)
			return records

		// Otherwise populate the array offchain
		const poolAddresses = await client.readContract({
			address: pool,
			abi: AAVEPoolAbi,
			functionName: 'getReservesList',
			blockNumber: block,
		})

		const pools = await Promise.all(poolAddresses.map(async (address: Address) => { 
			const token = await getToken(client, address)
			return new Pool({
				protocol: 'AAVE',
				address,
				network,
				underlyingSymbol: token.symbol,
				underlying: token
			})
		}))
		Pool.bulkSave(pools)
		return pools
	})
}


export const getToken = async (client: PublicClient, address: Address) => {
	// check if it's already in the db
	const id = getTokenId(client, address)
	const record = await Token.findOne({ id })
	if (record)
		return record

	// get the pair data.. todo, add symbol
	const [ decimals, symbol ] = await Promise.all([
		client.readContract({ 
			address: address as Address, 
			abi: erc20, 
			functionName: 'decimals',
		}),
		client.readContract({ 
			address: address as Address, 
			abi: erc20, 
			functionName: 'symbol',
		})
	])

	const token: IToken = {
		id,
		address: address,
		network: client.chain?.name as string,
		decimals: Number(decimals),
		symbol,
	}
	const doc = new Token(token)
	await doc.save()
	return doc
}