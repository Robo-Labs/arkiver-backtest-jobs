import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ICurvePoolUpdate {
	pool: any,
	block: number,
	timestamp: number,
	address: string,
	totalSupply: string,
}

export const CurvePoolUpdate = createEntity<ICurvePoolUpdate>("CurvePoolUpdate", {
	pool: { type: Types.ObjectId, ref: 'Pool'},
	timestamp: { type: Number, index: true },
	block: { type: Number, index: true },
	totalSupply: String,
})