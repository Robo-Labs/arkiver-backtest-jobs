import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

export interface IAmmPool {
	network: string,
	protocol: string,
	address: string,
	symbol: string,
	tokenSymbols: string[],
	tokens: any[],
	fee: number,
	tickSpacing: number,
	totalValueLockedUSD: number,
	totalValueLockedToken0: number,
	totalValueLockedToken1: number
}

export const AmmPool = createEntity<IAmmPool>("AmmPool", {
	network: String,
	protocol: String,
	address: String,
	symbol: String,
	tokenSymbols: [String],
	tokens: [{ type: Types.ObjectId, ref: 'Token'}],
	fee: Number,
	tickSpacing: Number,
	totalValueLockedUSD: Number,
	totalValueLockedToken0: Number,
	totalValueLockedToken1: Number

});

