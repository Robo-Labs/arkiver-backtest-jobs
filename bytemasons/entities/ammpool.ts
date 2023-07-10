import { createEntity } from "../deps.ts";
import { Address } from 'npm:viem'
import { Types } from 'npm:mongoose'
//import { IToken } from "./token.ts";
//import { Velodrome } from "./VelodomeV2Bribe.ts";

export interface IAmmPool {
	network: string
	protocol: string
	address: Address
	symbol: string
	//tokenSymbols: string[],
	tokens: [any]
	prices: [number]
	bribeAddress: Address
	feeVotingReward: Address
	//bribes: [any]
	// totalValueLockedUSD: number,
	// totalValueLockedToken0: string,
	// totalValueLockedToken1: string
}

export const AmmPool = createEntity<IAmmPool>("AmmPool", {
	network: String,
	protocol: String,
	address: String,
	symbol: String,
	//tokenSymbols: [String],
	tokens: [{ type: Types.ObjectId, ref: 'Token'}],
	prices: [Number],
	bribeAddress: String,
	feeVotingReward: String
	//bribes: [{ type: Types.ObjectId, ref: 'VelodromeV2Bribe'}]
	// totalValueLockedUSD: Number,
	// totalValueLockedToken0: String,
	// totalValueLockedToken1: String

});

