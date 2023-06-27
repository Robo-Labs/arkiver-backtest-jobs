import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

export interface IAmmPool {
	network: string,
	protocol: string,
	address: string,
	tokenSymbols: string[],
	tokens: any[],
	fee: number,
	tickSpacing: number
}

export const AmmPool = createEntity<IAmmPool>("AmmPool", {
	network: String,
	protocol: String,
	address: String,
	tokenSymbols: [String],
	tokens: [{ type: Types.ObjectId, ref: 'Token'}],
	fee: Number,
	tickSpacing: Number
});

