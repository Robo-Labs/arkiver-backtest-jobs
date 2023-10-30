import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISwap {
	pool: any
	timestamp: number
	block: number
	res: '1m' | '1h'
	// prices: number[]
	sqrtPriceX96: string
	feeGrowthGlobal0X128: string
	feeGrowthGlobal1X128: string
  liquidity: string
	low: string
	high: string
	// totalValueLockedUSD: number
	totalValueLockedToken0: string
	totalValueLockedToken1: string
}

export const Swap = createEntity<ISwap>("Swap", {
	pool: { type: Types.ObjectId, ref: 'AmmPool'},
	timestamp: { type: Number, index: true },
	block: { type: Number, index: true },
	res: String,
	// prices: [Number],
	sqrtPriceX96: String,
	feeGrowthGlobal0X128: String,
	feeGrowthGlobal1X128: String,
  liquidity: String,
	low: String,
	high: String,
	// totalValueLockedUSD: Number,
	totalValueLockedToken0: String,
	totalValueLockedToken1: String
})
