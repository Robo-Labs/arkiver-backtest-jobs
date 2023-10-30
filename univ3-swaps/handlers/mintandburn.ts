import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.22/mod.ts'
import { getPool } from "./poolhelper.ts"
import { CamelotAbi } from '../abis/camelotAbi.ts'
import { getReserves, updateReserves } from './reserves.ts'
import { UNIV3_POOL_ABI } from '../abis/UNI3PoolAbi.ts'

type Fee = {
  feeZto: number;
  feeOtz: number;
}

export const onFlash: EventHandlerFor<typeof UNIV3_POOL_ABI, "Flash"> = async (
  { event, client, store }
) => {
  const { paid0, paid1 } = event.args
  const reserves = await getReserves(client, store, event.blockNumber!, event.address)
  reserves.token0 += paid0
  reserves.token1 += paid1
  updateReserves(store, event.address, reserves)
}

export const onMint: EventHandlerFor<typeof UNIV3_POOL_ABI, "Mint"> = async (
  { event, client, store }
) => {
  const { amount0, amount1 } = event.args
  const reserves = await getReserves(client, store, event.blockNumber!, event.address, true)
}

export const onBurn: EventHandlerFor<typeof UNIV3_POOL_ABI, "Burn"> = async (
  { event, client, store }
) => {
  const { amount0, amount1 } = event.args
  const reserves = await getReserves(client, store, event.blockNumber!, event.address)
  reserves.token0 -= amount0
  reserves.token1 -= amount1
  updateReserves(store, event.address, reserves)
}