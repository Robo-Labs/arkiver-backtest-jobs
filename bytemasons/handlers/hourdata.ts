import { BlockHandler, Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { type PublicClient, type Block, type Address } from "npm:viem";
// import { Erc20Abi } from "../abis/erc20.ts";
import { PoolSnapshot } from "../entities/snapshot.ts";
import { VelodromeV2Bribe } from "../entities/VelodomeV2Bribe.ts";
import { TokenPrice } from "./tokenprice.ts";
import { toNumber } from "./util.ts";
import { AmmPool } from "../entities/ammpool.ts";
import { getReserves, getToken } from "./poolhelper.ts"
import {Token} from '../entities/token.ts'
//import { getToken } from "https://deno.land/x/robo_arkiver@v0.4.15/src/lib/nft/handler.ts";

const multicallAddress = '0xca11bde05977b3631167028862be2a173976ca11'
const HOUR = 60 * 60
const getNearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

async function getActiveBribes(pool: any, block: Block): Promise<typeof VelodromeV2Bribe[]>{
	const blockTimestampNumber = toNumber(block.timestamp)
	return await VelodromeV2Bribe.find({'poolAddress': pool.address, 'start': {$lt: blockTimestampNumber}, 'end':{$gt: blockTimestampNumber}})
}

const isStable = ['0xc5b001DC33727F8F26880B184090D3E252470D45', '0xc40f949f8a4e094d1b49a23ea9241d289b7b2819']

export const hourDataHandler: BlockHandler = async ({ block, client, store }: {
	block: Block;
	client: PublicClient;
	store: Store;
}): Promise<void> => {
	client.batch = { multicall: true }
	
	const now = Number(block.timestamp)
	const nowHour = getNearestHour(Number(now)) - HOUR
	const last = await PoolSnapshot.findOne({}).sort({ timestamp: -1 })
	const lastHour = last?.timestamp || nowHour - HOUR
	if (lastHour < nowHour) {
		const pools = await AmmPool.find({}).populate('tokens')
		
		// deno-lint-ignore require-await
		const snaps = (await Promise.all(pools.map(async pool => {
			//console.log(pool)

			const reservesRaw = await getReserves(client, pool.address, block.number!)
			reservesRaw.pop()
			const reserves = reservesRaw.map((reservesRaw, i) => {
				// console.log(`reservesMap i: ${i}`)
				return toNumber(reservesRaw, pool.tokens[i].decimals)
			})
			// console.log(`reserves: ${reserves}`)
			const token0Stable: boolean = isStable.includes(pool.tokens[0].address)
			const token1Stable: boolean = isStable.includes(pool.tokens[1].address) 
			//console.log(`pool.tokens:`)
			//console.log(pool.tokens)
			const price0 = await TokenPrice.get(client, store, block.number!, pool.tokens[0], token0Stable)
			let price1 = 0
			try{
				price1 = await TokenPrice.get(client, store, block.number!, pool.tokens[1], token1Stable)
			} catch(e){
				// console.log(`token1Stable: ${token1Stable}`)
				// console.log(`pool.tokens[1].address: ${pool.tokens[1].address}`)
				let quoteBase = await TokenPrice.getVelodromeV2SpotPriceInToken(client,block.number!,pool.tokens[1],pool.tokens[0],token1Stable)
				let quoteBaseNormal = toNumber(quoteBase, pool.tokens[0].decimals)
				price1 = quoteBaseNormal*price0
			}
			
			// console.log(`reserves[0]: ${reserves[0]}, price0: ${price0}`)
			// console.log(`reserves[1]: ${reserves[1]}, price1: ${price1}`)

			const reservesTvl = price0*reserves[0]+price1*reserves[1]
			const bribes = await getActiveBribes(pool, block)
			// console.log('bribes:')
			// console.log(bribes)
			let bribeTvl = 0
			const bribePrices = await Promise.all(
				bribes.map(async (bribe) => {
					// console.log('bribe.reward')
					// console.log(bribe.rewardAddress)
					const reward = await getToken(client, client.chain!.name, bribe.rewardAddress)
					const price = await TokenPrice.get(client, store, block.number!, reward, false )
					const amountUSD = price*bribe.amount
					// console.log(`amountUSD: ${amountUSD}`)
					bribeTvl += amountUSD
					//console.log(`bribe: ${bribe}`)
					//console.log(`price: ${price}`)
					return price
				})
			)
			// console.log('bribePrices')
			// console.log(bribePrices)
			// const bribesUsd = await Promise.all(bribes.map(async (bribe) =>{
			// 		const reward = await getToken(client, client.chain!.name, bribe.rewardAddress)
			// 		const price = await store.retrieve(`${toNumber(block.number!)}:${bribe.reward.address}:price`, async(){
			// 			return await TokenPrice.get(client, store, block.number!, bribe.reward.address, false )
			// 		})
				// 	return price * bribe.amount
				// }))
			//let bribeTvl = 0
			// console.log(`bribeTvl: ${bribeTvl}`)
			// if(bribesUsd.length > 0){
			// 	bribeTvl = bribesUsd.reduce((total, num) => total + num, 0)
			// }
			

			return new PoolSnapshot({
				pool: pool,
				timestamp: toNumber(block.timestamp),
				reserves,
				symbol: pool.symbol,
				//totalSupply: Number,
				bribes: bribes,
				//bribeBalance: [Number], // TODO: Technically this may be able to be calculated without rpc calls
				bribePrices,
				bribeTvl,
				reservesTvl
			})
			
		}))).filter(e => e !== null)
		await PoolSnapshot.bulkSave(snaps as any)
	}

}