import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.22/mod.ts'
import { getPool } from "./poolhelper.ts"
import { CamelotAbi } from '../abis/camelotAbi.ts'
import { getReserves, updateReserves } from './reserves.ts'

type Fee = {
  feeZto: number;
  feeOtz: number;
}

export const onMint: EventHandlerFor<typeof CamelotAbi, "Mint"> = async (
  { event, client, store }
) => {
  const { amount0, amount1 } = event.args
  const reserves = await getReserves(client, store, event.blockNumber!, event.address)
  if (!reserves.fetched) {
    reserves.token0 += amount0
    reserves.token1 += amount1
    updateReserves(store, event.address, reserves)
  }
}


export const onBurn: EventHandlerFor<typeof CamelotAbi, "Burn"> = async (
  { event, client, store }
) => {
  const { amount0, amount1 } = event.args
  const reserves = await getReserves(client, store, event.blockNumber!, event.address)
  if (!reserves.fetched) {
    reserves.token0 -= amount0
    reserves.token1 -= amount1
    updateReserves(store, event.address, reserves)
  }
}