import { createEntity } from "../deps.ts";
import { Address } from 'npm:viem'
import { Types } from 'npm:mongoose'
import { IToken } from "./token.ts";

export interface IAmmPool {
	network: string,
	protocol: string,
	address: Address,
	symbol: string,
	tokenSymbols: string[],
	tokens: IToken[],
	fee: number,
	tickSpacing: number,
	totalValueLockedUSD: number,
	totalValueLockedToken0: string,
	totalValueLockedToken1: string
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
	totalValueLockedToken0: String,
	totalValueLockedToken1: String

});

