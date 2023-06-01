import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

export interface ICurvePool {
	network: string
	address: string,
	symbol: string,
	token: string,
	gauge: string,
	tokenSymbols: string[]
	tokens: any[]
}

export const CurvePool = createEntity<ICurvePool>("CurvePool", {
	network: String,
	address: String,
	token: String,
	symbol: String,
	gauge: String,
	tokenSymbols: [String],
	tokens: [{ type: Types.ObjectId, ref: 'Token'}]
});

