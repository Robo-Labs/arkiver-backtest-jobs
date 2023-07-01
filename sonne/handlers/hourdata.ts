import { BlockHandler, Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { type PublicClient, type Block, Address } from "npm:viem";
import { AAVEPoolDataAbi } from "../abis/AAVEPoolDataAbi.ts";
import { getPools, getUnitroller } from "./entityutil.ts";
import { CTokenAbi } from "../abis/CTokenAbi.ts";
import { Snapshot } from "../entities/snapshot.ts";
import { UnitrollerAbi } from "../abis/UnitrollerAbi.ts";
import { VeloRouterAbi } from "../abis/VeloRouterAbi.ts";

const HOUR = 60 * 60
// TODO - Only for OP, make generic
const BLOCK_PER_YEAR = (365n * 24n * 60n * 60n) // 1sec blocks
const SONNE: Address = '0x1DB2466d9F5e10D7090E7152B68d62703a2245F0'
const OP: Address = '0x4200000000000000000000000000000000000042'
const WETH: Address = '0x4200000000000000000000000000000000000006'
const VELO_ROUTER = '0x9c12939390052919aF3155f41Bf4160Fd3666A6f'


const nearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

const toNumber = (n: bigint, decimals: number = 0) => {
	return Number(n) / (10 ** decimals)
}

const pathToSonne = (token: Address) => {
	return token === WETH ? 
		[{ from: SONNE, to: WETH, stable: false }] : 
		[{ from: SONNE, to: WETH, stable: false }, { from: WETH, to: token, stable: false }]
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
		const pools = (await getPools(client, store, block.number!))
		const { unitroller } = getUnitroller(client)

		const records = await Promise.all(pools.map(async pool => {
			const underlying = pool.underlying.address as Address
			const path = pathToSonne(underlying)
			const [ 
				cTokenTotalSupply,
				exchangeRateStored,
				supplyRatePerBlock,
				borrowRatePerBlock,
				compSupplySpeeds,
				compBorrowSpeeds,
				sonnePriceInUnderlying,
			 ] = (await client.multicall({
				contracts: [
					{ address: pool.address as Address, abi: CTokenAbi, functionName: 'totalSupply' },
					{ address: pool.address as Address, abi: CTokenAbi, functionName: 'exchangeRateStored' },
					{ address: pool.address as Address, abi: CTokenAbi, functionName: 'supplyRatePerBlock' },
					{ address: pool.address as Address, abi: CTokenAbi, functionName: 'borrowRatePerBlock' },
					{ address: unitroller, abi: UnitrollerAbi, functionName: 'compSupplySpeeds', args: [ pool.address as Address ] },
					{ address: unitroller, abi: UnitrollerAbi, functionName: 'compBorrowSpeeds', args: [ pool.address as Address ] },
					{ address: VELO_ROUTER, abi: VeloRouterAbi, functionName: 'getAmountOut', args: [BigInt(1e18), SONNE, underlying] },
				],
				blockNumber: block.number!,
			}))
			
			const sonnePrice = sonnePriceInUnderlying.result![0]
			const liquidityRate = toNumber(supplyRatePerBlock.result! * BLOCK_PER_YEAR, 18)
			const variableBorrowRate = toNumber(borrowRatePerBlock.result! * BLOCK_PER_YEAR, 18)
			const totalSupply = toNumber(cTokenTotalSupply.result! * exchangeRateStored.result! / BigInt(1e18), pool.underlying.decimals)

			return new Snapshot({
				timestamp: nowHour,
				block: Number(block.number),
				pool: pool,
				underlying: pool.underlying,
				liquidityRate,
				variableBorrowRate,
				totalSupply,
				cTokenTotalSupply: toNumber(cTokenTotalSupply.result!, 1e8),
				totalDebt: 0, // Todo
				compPrice: toNumber(sonnePrice, 18), // in pool units
				compSupplyPerBlock: toNumber(compSupplySpeeds.result!, 1e18),
				compBorrowPerBlock: toNumber(compBorrowSpeeds.result!, 1e18),
			})
		}))

		await Snapshot.bulkSave(records)
	}
}