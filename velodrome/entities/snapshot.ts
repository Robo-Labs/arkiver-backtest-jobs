import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISnapshot {
	pool: any,
	timestamp: number,
	block: number,
	res: '1m' | '1h'
	totalSupply: number,
	reserves: number[],
	prices: number[]
}

export const Snapshot = createEntity<ISnapshot>("Snapshot", {
	pool: { type: Types.ObjectId, ref: 'Pool'},
	timestamp: { type: Number, index: true },
	block: { type: Number, index: true },
	res: String,
	totalSupply: Number,
	reserves: [Number],
	prices: [Number]
})
