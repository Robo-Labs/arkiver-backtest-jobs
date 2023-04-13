import { createEntity } from "../deps.ts";

interface ITotalSupply {
	id: string
	block: number,
	totalSupply: number,
}

export const TotalSupply = createEntity<ITotalSupply>("total_supply", {
  id: String,
  block: { type: Number, index: true },
  totalSupply: Number,
});
