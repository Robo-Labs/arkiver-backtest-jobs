import { formatUnits } from "../deps.ts"

export const toNumber = (x: bigint, decimals: number): number => {
  return parseFloat(formatUnits(x, decimals))
}