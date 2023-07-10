import { createEntity } from '../deps.ts'
import { Types } from 'npm:mongoose'

export interface IVelodromeV2Vote {
    pool: any
    timestamp: number
    voter: string
    tokenId: number
    weight: string
    totalWeight: string
}

export const VelodromeV2Vote = createEntity<IVelodromeV2Vote>('VelodromeV2Vote', {
    pool: { type: Types.ObjectId, ref: 'AmmPool'},
    timestamp: Number,
    voter: String,
    tokenId: Number,
    weight: String,
    totalWeight: String
})
