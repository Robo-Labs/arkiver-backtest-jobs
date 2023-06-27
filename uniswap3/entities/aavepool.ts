import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

export interface IAavePool {
	address: string,
	protocol: string
	network: string
	underlyingSymbol: string
	underlying: any 
}

export const AavePool = createEntity<IAavePool>("AavePool", {
	address: String,
	protocol: String,
	network: String,
	underlyingSymbol: String,
	underlying: { type: Types.ObjectId, ref: 'Token'},
});