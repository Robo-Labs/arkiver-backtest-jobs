import { createEntity } from '../deps.ts'
import { Types } from 'npm:mongoose'

export interface IVelodromeV2Claim {
    timestamp: number
    address: string
    from: string
    reward: string
    amount: string
}

export const VelodromeV2Claim = createEntity<IVelodromeV2Claim>('VelodromeV2Claim', {
    timestamp: Number,
    address: String,
    from: String,
    reward: String,
    amount: String
})
