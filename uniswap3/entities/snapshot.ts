import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISnapshot {
	pool: any,
	timestamp: number,
	block: number,
	res: '1m' | '1h'
	totalSupply: number,
	prices: number[],
	sqrtPriceX96: number,
	tick: number,
	feeGrowthGlobal0X128: string,
	feeGrowthGlobal1X128: string,
	low: number,
	high: number

}

export const Snapshot = createEntity<ISnapshot>("Snapshot", {
	pool: { type: Types.ObjectId, ref: 'Pool'},
	timestamp: { type: Number, index: true },
	block: { type: Number, index: true },
	res: String,
	totalSupply: Number,
	prices: [Number],
	sqrtPriceX96: Number,
	tick: Number,
	feeGrowthGlobal0X128: String,
	feeGrowthGlobal1X128: String,
	low: Number,
	high: Number
})
