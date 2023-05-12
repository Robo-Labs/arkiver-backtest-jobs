import { createEntity } from "../deps.ts";
import { Network } from "../types.ts";

export interface IToken {
	id: string
	address: string
	network: string | Network
	decimals: number
}

export const Token = createEntity<IToken>("Token", {
	id: String,
	address: String,
	network: String,
	decimals: Number,
});
