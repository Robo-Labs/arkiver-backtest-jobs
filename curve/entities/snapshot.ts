import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISnapshot {
	res: '1m' | '1h'
	pool: any,
	block: number,
	timestamp: number,
	totalSupply: number,
	reserves: number[],
	prices: number[],
	virtualPrice: number,
	crvRate: number,
	crvPrice: number,
	gaugeRelativeWeight: number,
	gaugeTotalSupply: number,
}

export const Snapshot = createEntity<ISnapshot>("Snapshot", {
	pool: { type: Types.ObjectId, ref: 'Pool'},
	timestamp: { type: Number, index: true },
	block: { type: Number, index: true },
	res: String,
	totalSupply: Number,
	reserves: [Number],
	prices: [Number],
	virtualPrice: Number,
	crvRate: Number,
	crvPrice: Number,
	gaugeRelativeWeight: Number,
	gaugeTotalSupply: Number,
})
