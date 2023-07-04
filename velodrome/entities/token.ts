import { createEntity } from "../deps.ts";

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
