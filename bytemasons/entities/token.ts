import { createEntity } from "../deps.ts";
import { Address } from 'npm:viem'

export interface IToken {
	address: string
	network: string
	decimals: number
	symbol: string
}

export const Token = createEntity<IToken>("Token", {
	address: String,
	network: String,
	decimals: Number,
	symbol: String,
});
