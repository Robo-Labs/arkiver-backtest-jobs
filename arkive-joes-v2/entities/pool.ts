import { Token } from "npm:graphql";
import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

export interface IPool {
  address: string
  symbol: string
  tokenX: any
  tokenY: any
}

export const Pool = createEntity<IPool>("Pool", {
  address: String,
	symbol: String,
	tokenX: { type: Types.ObjectId, ref: 'Token'},
	tokenY: { type: Types.ObjectId, ref: 'Token'},
});