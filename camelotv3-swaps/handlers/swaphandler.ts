import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.22/mod.ts'
import { getBlock, getPool } from "./poolhelper.ts"
import { CamelotAbi } from '../abis/camelotAbi.ts'
import { getReserves, updateReserves } from './reserves.ts'
import { Erc20Abi } from '../abis/erc20.ts'
import { Swap } from '../entities/swap.ts'
import { max, min, toNumber } from './util.ts'
import { toHex } from 'npm:viem'

type Fee = {
  feeZto: number;
  feeOtz: number;
}

let oldFee: {
  feeGrowthGlobal0X128: number
  feeGrowthGlobal1X128: number
} | undefined

export const onSwap: EventHandlerFor<typeof CamelotAbi, "Swap"> = async (
  { event, client, store }
) => {
  const { amount0, amount1, liquidity, price, recipient, sender, tick } = event.args
  const fee = store.get(`fee:${event.address}`) as Fee
  let lastPrice = store.get(`price:${event.address}`) as bigint | undefined
  const block = await getBlock(client, store, event.blockNumber!)
  store.set(`price:${event.address}`, price)

  if (!lastPrice) {
    lastPrice = price
  }
  
  if (!fee) {
    console.log(event.blockNumber)
    throw Error('no fee?')
  }

  const pool = await getPool(client, store, event.address)
  const communityFee = 150n
  const communityFeeDenom = 1e3
  const totalFeeDenom = 1e6
  const totalFee0 = amount0 > 0 ? amount0 * BigInt(fee.feeOtz) / BigInt(totalFeeDenom - fee.feeOtz) : 0n
  const totalFee1 = amount1 > 0 ? amount1 * BigInt(fee.feeZto) / BigInt(totalFeeDenom - fee.feeZto) : 0n
  const communityFee0 = totalFee0 * communityFee / BigInt(communityFeeDenom)
  const communityFee1 = totalFee1 * communityFee / BigInt(communityFeeDenom)
  const lpFee0 = totalFee0 - communityFee0
  const lpFee1 = totalFee1 - communityFee1

  const relativeFeeGrowthX128 = await store.retrieve(`relativeFeeGrowth:${event.address}`, () => {
    return { token0: 0n, token1: 0n }
  })
  relativeFeeGrowthX128.token0 += lpFee0 * BigInt(2 ** 128) / BigInt(liquidity)
  relativeFeeGrowthX128.token1 += lpFee1 * BigInt(2 ** 128) / BigInt(liquidity)
  store.set(`relativeFeeGrowth:${event.address}`, relativeFeeGrowthX128)

  const reserves = await getReserves(client, store, event.blockNumber!, event.address)
  if (!reserves.fetched) {
    reserves.token0 += amount0 - communityFee0
    reserves.token1 += amount1 - communityFee1
    updateReserves(store, event.address, reserves)
  }

  const decimals0 = pool.tokens[0].decimals
  const decimals1 = pool.tokens[1].decimals
  Swap.create({
    pool,
    timestamp: Number(block.timestamp!),
    block: Number(event.blockNumber!),
    res: 'swap',
    sqrtPriceX96: toHex(price),
    feeGrowthGlobal0X128: toNumber(relativeFeeGrowthX128.token0, decimals0),
    feeGrowthGlobal1X128: toNumber(relativeFeeGrowthX128.token1, decimals1),
    liquidity: toHex(liquidity),
    low: toHex(min(lastPrice, price)),
    high: toHex(max(lastPrice, price)),
    totalValueLockedToken0: toNumber(reserves.token0, decimals0),
    totalValueLockedToken1: toNumber(reserves.token1, decimals1),
    totalFee0: toNumber(totalFee0, decimals0),
    totalFee1: toNumber(totalFee1, decimals1),
    communityFee0: toNumber(communityFee0, decimals0),
    communityFee1: toNumber(communityFee1, decimals1),
    lpFee0: toNumber(lpFee0, decimals0),
    lpFee1: toNumber(lpFee1, decimals1),
  })
}