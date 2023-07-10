import { createEntity } from '../deps.ts'
import { Types } from 'npm:mongoose'

export interface IVelodromeV2Bribe {
    pool: any
    poolAddress: string
    timestamp: number
    start: number
    end: number
    sender: string
    reward: any
    rewardAddress: string
    epoch: number
    amount: number
}

export const VelodromeV2Bribe = createEntity<IVelodromeV2Bribe>('VelodromeV2Bribe', {
    pool: [{ type: Types.ObjectId, ref: 'AmmPool'}],
    poolAddress: String,
    timestamp: Number,
    start: Number,
    end: Number,
    sender: String,
    reward: { type: Types.ObjectId, ref: 'Token'},
    rewardAddress: String,
    epoch: Number,
    amount: Number
})
