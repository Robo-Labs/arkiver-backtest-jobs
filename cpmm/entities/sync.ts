import { createEntity } from "../deps.ts";

interface ISync {
	id: string
	block: number
	lp: string
	timestamp: number
	reserves0: number
	reserves1: number
}

export const Sync = createEntity<ISync>("sync", {
  id: String,
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
  lp: String,
  reserves0: Number,
  reserves1: Number,
});
