import { BlockHandler, Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { type PublicClient, type Block, type Address } from "npm:viem";
import { Erc20Abi } from "../abis/erc20.ts";
import { velodromeAbi } from "../abis/velodromeAbi.ts";
import { VelodromeVoterAbi } from "../abis/VelodromeVoterAbi.ts"
import { Snapshot } from "../entities/snapshot.ts";
import { FarmSnapshot } from "../entities/farmsnapshot.ts";
import { getPool, getPoolCount, getRewardRate, getToken } from "./poolhelper.ts";
import { TokenPrice } from "./tokenprice.ts";
import { toNumber } from "./util.ts";
import { VelodromeGaugeAbi } from "../abis/VelodromeGaugeAbi.ts";
import { VelodromeRouterAbi } from "../abis/VelodromeRouter.ts";

export const POOLS: { pool: Address, token: Address, stable: Boolean }[] = [
	{ pool: '0x207AddB05C548F262219f6bFC6e11c02d0f7fDbe', token: '0x207AddB05C548F262219f6bFC6e11c02d0f7fDbe', stable: true } // LUSD / USDC
]

const HOUR = 60 * 60
const nearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

export const hourDataHandler: BlockHandler = async ({ block, client, store }: {
	block: Block;
	client: PublicClient;
	store: Store;
}): Promise<void> => {
	const now = Number(block.timestamp)
	const nowHour = nearestHour(Number(now))
	const last = await Snapshot.findOne({}).sort({ timestamp: -1 })
	const lastHour = last?.timestamp ?? (nearestHour(now) - HOUR)
	if (lastHour < nowHour) {
		if (await getPoolCount() === 0) {
			await Promise.all(POOLS.map(info => getPool(client, info.pool, info.stable, info.token))) // hack to make sure all pools exist
		}
		
		const records = await Promise.all(POOLS.map(async info => {
			const pool = await getPool(client, info.pool, info.stable, info.token)
			const network = client.chain!.name
			const veloTokenAddress = '0x3c8B650257cFb5f272f799F5e2b4e65093a11a05'
			const velo = await store.retrieve(`token:${veloTokenAddress}`, async() => {
				return await getToken(client, network, veloTokenAddress)
			})
			let [
				totalSupply,
				reservesBigInt,
				rewardPerToken,
				veloPrice
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
					args: [],
					blockNumber: block.number!
				}),
				getRewardRate(client, store, block, pool.address),
				TokenPrice.get(client, store, block.number!, velo)
			])
			reservesBigInt.pop()
			const reserves = reservesBigInt.map((e, i) => toNumber(e, pool.tokens[i].decimals))
			const prices = await Promise.all(pool.tokens.map((token) => {
				return TokenPrice.get(client, store, block.number!, token)
			}))


			// FARM SNAPSHOT
			const veloVoter = '0x09236cfF45047DBee6B921e00704bed6D6B8Cf7e'
			const gauge: Address = await store.retrieve(`veloGauge:${pool}`, async () => {
				return await client.readContract({
					abi: VelodromeVoterAbi,
					address: veloVoter,
					functionName: 'gauges',
					args: [pool.address],
					blockNumber: block.number!,
				})
			})
			// const [
			// 	rewardPerToken,
			// 	veloPriceResult,
			// ] = (await client.multicall({
			// 	contracts: [
			// 		{ address: gauge, abi: VelodromeGaugeAbi, functionName: 'rewardPerToken', args: [veloTokenAddress] },
			// 		{ address: VELODROME_ROUTER, abi: VelodromeRouterAbi, functionName: 'getAmountOut', args: [10**18, veloTokenAddress, USDC] },
			// 	],
			// 	blockNumber: block.number!,
			// })).map(e => e.result)
			const farmSnapshot = new FarmSnapshot({
				network: client.chain?.name,
				protocol: "Velodrome",
				pool: pool,
				poolAddress: pool.address,
				gauge,
				block: toNumber(block.number!),
				timestamp: nowHour,
				rewardTokens: [velo],
				rewardTokenUSDPrices: [veloPrice],
				rewardPerToken
			})
			await farmSnapshot.save()

			return new Snapshot({
				res: '1h',
				pool,
				block: Number(block.number),
				timestamp: nowHour,
				totalSupply: toNumber(totalSupply, 18),
				reserves,
				prices: prices
			})
		}))
		await Snapshot.bulkSave(records)
	}
}