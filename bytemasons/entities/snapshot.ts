import { createEntity } from '../deps.ts'
import { Types } from 'npm:mongoose'

export interface IPoolSnapshot {
    pool: any
    timestamp: number
    reserves: [number]
    symbol: string
    //totalSupply: number
    bribes: [any]
    bribeBalance: [number]
    bribePrices: [number]
    bribeTvl: number
    reservesTvl: number
}

export const PoolSnapshot = createEntity<IPoolSnapshot>('PoolSnapshot', {
    pool: [{ type: Types.ObjectId, ref: 'AmmPool'}],
    timestamp: Number,
    reserves: [Number],
    symbol: String,
    //totalSupply: Number,
    bribes: [{ type: Types.ObjectId, ref: 'VelodromeV2Bribe'}],
    bribeBalance: [Number],
    bribePrices: [Number],
    bribeTvl: Number,
    reservesTvl: Number
})
