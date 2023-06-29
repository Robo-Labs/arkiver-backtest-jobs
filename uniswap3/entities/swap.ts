import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISwap {
    pool: any
    timestamp: number
    block: number
    hash: string
    sender: string
    recipient: string
    amount0: number
    amount1: number
    price0: number
    price1: number
    sqrtPriceX96: string
    liquidity: number
    tick: number
}

export const Swap = createEntity<ISwap>("Swap", {
	pool: { type: Types.ObjectId, ref: 'AmmPool'},
	timestamp: { type: Number, index: true },
    hash: String,
	block: { type: Number, index: true },
    sender: String,
    recipient: String,
    amount0: Number,
    amount1: Number,
    price0: { type: Number, index: true },
    price1: { type: Number, index: true },
    sqrtPriceX96: String,
    liquidity: Number,
    tick: Number
})
