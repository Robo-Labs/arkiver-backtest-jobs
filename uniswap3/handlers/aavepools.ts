import { type PublicClient, type Address } from "npm:viem";
import { Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { AAVEPoolAbi } from "../abis/AAVEPoolAbi.ts";
import { getToken } from "./poolhelper.ts";
import { AavePool } from "../entities/aavepool.ts";


export const AavePoolLu: {[key: string]: Address } = {
	'ethereum': '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
	'optimism': '0x794a61358D6845594F94dc1DB02A252b5b4814aD',
}

export const AavePoolDataLu: {[key: string]: Address } = {
	'ethereum': '0x7B4EB56E7CD4b454BA8ff71E4518426369a138a3',
	'optimism': '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654',
}

export const getPools = async (client: PublicClient) => {
	const {pool, network} = getPoolAddress(client)

	const records = await AavePool.find({ network }).populate('underlying')
	if (records.length > 0)
		return records

	// Otherwise populate the array offchain
	const poolAddresses = await client.readContract({
		address: pool,
		abi: AAVEPoolAbi,
		functionName: 'getReservesList',
	})

	console.log('calling gettoken from aave')
	const pools = await Promise.all(poolAddresses.map(async (address: Address) => { 
		const token = await getToken(client, network, address)
		return new AavePool({
			protocol: 'AAVE',
			address,
			network,
			underlyingSymbol: token.symbol,
			underlying: token
		})
	}))
	AavePool.bulkSave(pools)
	return pools
}

export const getPoolAddress = (client: PublicClient) => {
	if (!client.chain)
		throw new Error('Chain must be specified')
	const network = client.chain.name.toLocaleLowerCase()
	const pool = AavePoolLu[network]
	if (!pool)
		throw new Error('Unknown Pool for network: ' + network)
	return {pool, network}
}