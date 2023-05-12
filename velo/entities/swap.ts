import { createEntity } from "../deps.ts";

interface ISwap {
	id: string,
	block: number,
	timestamp: number,
	lp: string,
	amount0In: number,
	amount0Out: number,
	amount1In: number,
	amount1Out: number,
	reserves0: number,
	reserves1: number,
}

export const Swap = createEntity<ISwap>("swap", {
  id: String,
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
  lp: String,
  amount0In: Number,
  amount0Out: Number,
  amount1In: Number,
  amount1Out: Number,
  reserves0: Number,
  reserves1: Number,
});
