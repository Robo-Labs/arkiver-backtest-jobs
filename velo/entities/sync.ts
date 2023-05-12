import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISync {
	pairId: string
	block: number
	pair: any
	timestamp: number
	reserves0: string // hex string
	reserves1: string // hex string
}

export const Sync = createEntity<ISync>("sync", {
  pairId: String,
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
  pair: { type: Types.ObjectId, ref: 'Pair'},
  reserves0: String,
  reserves1: String,
});
