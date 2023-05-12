import { createEntity } from "../deps.ts";

interface ITotalSupply {
	id: string
	block: number,
	totalSupply: string,
}

export const TotalSupply = createEntity<ITotalSupply>("totalsupply", {
  id: String,
  block: { type: Number, index: true },
  totalSupply: String,
});
