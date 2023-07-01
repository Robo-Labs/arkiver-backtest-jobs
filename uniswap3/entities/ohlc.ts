import { createEntity } from "../deps.ts";
import { Hex, Address } from 'npm:viem'
import { Types } from 'npm:mongoose'

interface IOhlc {
	pool: any
  timestamp: number
  address: Address
  open: Hex
  high: Hex
  low: Hex
  close: Hex
  volume: Hex
}

export const Ohlc = createEntity<IOhlc>("Ohlc", {
	pool: { type: Types.ObjectId, ref: 'AmmPool'},
	timestamp: { type: Number, index: true },
	address: { type: String, index: true },
  open: String,
  high: String,
  low: String,
  close: String,
  volume: String
})
