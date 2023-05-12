import { createEntity } from "../deps.ts";
import { Types, Document } from 'npm:mongoose'

export interface IPair {
	id: string
	address: string
	network: string
	token0: any // document. TODO: Improve Types
	token1: any
}

export const Pair = createEntity<IPair>("Pair", {
	id: String,
	address: String,
	network: String,
	token0: { type: Types.ObjectId, ref: 'Token'},
	token1: { type: Types.ObjectId, ref: 'Token'},
});

export type PairType = (Document<unknown, {}, IPair> & Omit<IPair & {
    _id: Types.ObjectId;
}, never>)