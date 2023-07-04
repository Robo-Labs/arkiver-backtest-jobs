import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

export interface IPool {
	address: string
	protocol: string
	network: string
	underlyingSymbol: string
	underlying: any 
}

export const Pool = createEntity<IPool>("Pool", {
	address: String,
	protocol: String,
	network: String,
	underlyingSymbol: String,
	underlying: { type: Types.ObjectId, ref: 'Token'},
});