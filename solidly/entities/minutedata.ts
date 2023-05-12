import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface IMinuteData {
	id: string
	pair: any,
	address: string,
	timestamp: number,
	totalSupply: number,
	reserves0: number,
	reserves1: number,
}

export const MinuteData = createEntity<IMinuteData>("MinuteData", {
	id: String,
	pair: { type: Types.ObjectId, ref: 'Pair'},
	address: String,
	timestamp: { type: Number, index: true },
	totalSupply: Number,
	reserves0: Number,
	reserves1: Number,
});
