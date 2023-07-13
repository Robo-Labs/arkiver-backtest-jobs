import { createEntity } from '../deps.ts'

export interface IPrice {
  timestamp: number
  sharePrice: number
  prices: Record<string, number>
}

export const Price = createEntity<IPrice>('Price', {
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
  prices: Object,
})
