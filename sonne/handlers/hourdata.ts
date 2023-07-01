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
const USDC: Address = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607'
const USDT: Address = '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58'
const LUSD: Address = '0xc40F949F8a4e094D1b49a23ea9241D289B7b2819'


const nearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

const toNumber = (n: bigint, decimals: number = 0) => {
	return Number(n) / (10 ** decimals)
}

const isStableCoin = (token: Address) => {
	return [USDT, LUSD].includes(token)
}

const pathFromSonne = (token: Address) => {
	return token === USDC ? 
		[{ from: SONNE, to: token, stable: false }] : 
		[{ from: SONNE, to: USDC, stable: false }, { from: USDC, to: token, stable: isStableCoin(token) }]
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
			const path = pathFromSonne(underlying)
			const [ 
				cTokenTotalSupply,
				cTokenTotalBorrow,
				exchangeRateStored,
				supplyRatePerBlock,
				borrowRatePerBlock,
				compSupplySpeeds,
				compBorrowSpeeds,
				sonnePriceInUnderlying,
			 ] = (await client.multicall({
				contracts: [
					{ address: pool.address as Address, abi: CTokenAbi, functionName: 'totalSupply' },
					{ address: pool.address as Address, abi: CTokenAbi, functionName: 'totalBorrows' },
					{ address: pool.address as Address, abi: CTokenAbi, functionName: 'exchangeRateStored' },
					{ address: pool.address as Address, abi: CTokenAbi, functionName: 'supplyRatePerBlock' },
					{ address: pool.address as Address, abi: CTokenAbi, functionName: 'borrowRatePerBlock' },
					{ address: unitroller, abi: UnitrollerAbi, functionName: 'compSupplySpeeds', args: [ pool.address as Address ] },
					{ address: unitroller, abi: UnitrollerAbi, functionName: 'compBorrowSpeeds', args: [ pool.address as Address ] },
					{ address: VELO_ROUTER, abi: VeloRouterAbi, functionName: 'getAmountsOut', args: [BigInt(1e18), path] },
				],
				blockNumber: block.number!,
			}))
			
			// console.log(SONNE, underlying)
			const sonnePrice = sonnePriceInUnderlying.result![path.length]
			const liquidityRate = toNumber(supplyRatePerBlock.result! * BLOCK_PER_YEAR, 18)
			const variableBorrowRate = toNumber(borrowRatePerBlock.result! * BLOCK_PER_YEAR, 18)
			const totalSupply = toNumber(cTokenTotalSupply.result! * exchangeRateStored.result! / BigInt(1e18), pool.underlying.decimals)
			const totalDebt = toNumber(cTokenTotalBorrow.result!, pool.underlying.decimals)

			return new Snapshot({
				timestamp: nowHour,
				block: Number(block.number),
				pool: pool,
				underlying: pool.underlying,
				liquidityRate,
				variableBorrowRate,
				totalSupply,
				totalDebt, // Todo
				cTokenTotalSupply: toNumber(cTokenTotalSupply.result!, 8),
				compPrice: toNumber(sonnePrice, pool.underlying.decimals), // in pool units
				compSupplyPerBlock: toNumber(compSupplySpeeds.result!, 18),
				compBorrowPerBlock: toNumber(compBorrowSpeeds.result!, 18),
			})
		}))

		await Snapshot.bulkSave(records)
	}
}