import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

export interface IAmmPool {
	network: string,
	protocol: string,
	address: string,
	token: string,
	symbol: string,
	tokenSymbols: string[]
	tokens: any[]
}

export const AmmPool = createEntity<IAmmPool>("AmmPool", {
	network: String,
	protocol: String,
	address: String,
	token: String,
	symbol: String,
	tokenSymbols: [String],
	tokens: [{ type: Types.ObjectId, ref: 'Token'}]
});

