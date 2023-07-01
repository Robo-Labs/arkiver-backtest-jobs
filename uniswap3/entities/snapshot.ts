import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISnapshot {
	pool: any
	timestamp: number
	block: number
	res: '1m' | '1h'
	prices: number[]
	sqrtPriceX96: string
	feeGrowthGlobal0X128: string
	feeGrowthGlobal1X128: string
	low: number
	high: number
	totalValueLockedUSD: number
	totalValueLockedToken0: string
	totalValueLockedToken1: string

}

export const Snapshot = createEntity<ISnapshot>("Snapshot", {
	pool: { type: Types.ObjectId, ref: 'AmmPool'},
	timestamp: { type: Number, index: true },
	block: { type: Number, index: true },
	res: String,
	prices: [Number],
	sqrtPriceX96: String,
	feeGrowthGlobal0X128: String,
	feeGrowthGlobal1X128: String,
	low: Number,
	high: Number,
	totalValueLockedUSD: Number,
	totalValueLockedToken0: String,
	totalValueLockedToken1: String
})
