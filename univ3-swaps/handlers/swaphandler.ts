import { type EventHandlerFor } from '../deps.ts'
import { getBlock, getPool } from "./poolhelper.ts"
import { getReserves, updateReserves } from './reserves.ts'
import { Erc20Abi } from '../abis/erc20.ts'
import { Swap } from '../entities/swap.ts'
import { max, min, toNumber } from './util.ts'
import { toHex } from 'npm:viem'
import { UNIV3_POOL_ABI } from '../abis/UNI3PoolAbi.ts'

type Fee = {
  feeZto: number;
  feeOtz: number;
}

let oldFee: {
  feeGrowthGlobal0X128: number
  feeGrowthGlobal1X128: number
} | undefined

export const onSwap: EventHandlerFor<typeof UNIV3_POOL_ABI, "Swap"> = async (
  { event, client, store }
) => {
  const { amount0, amount1, liquidity, sqrtPriceX96: price, recipient, sender, tick } = event.args

  let lastPrice = store.get(`price:${event.address}`) as bigint | undefined
  const block = await getBlock(client, store, event.blockNumber!)
  store.set(`price:${event.address}`, price)

  if (!lastPrice) {
    lastPrice = price
  }

  const pool = await getPool(client, store, event.address)
  const FEE_DENOM = 1e6
  const [
    // feeGrowthGlobal0X128,
    // feeGrowthGlobal1X128,
    totalValueLockedToken0,
    totalValueLockedToken1,
  ] = await client.multicall({
    contracts: [
      // { abi: UNIV3_POOL_ABI, address: pool.address, functionName: "feeGrowthGlobal0X128" },
      // { abi: UNIV3_POOL_ABI, address: pool.address, functionName: "feeGrowthGlobal1X128" },
      { abi: Erc20Abi, address: pool.tokens[0].address, functionName: "balanceOf", args: [pool.address] },
      { abi: Erc20Abi, address: pool.tokens[1].address, functionName: "balanceOf", args: [pool.address] },
    ],
    blockNumber: block.number!,
  }).then(res => res.map(e => e.result!))

  // console.log(feeGrowthGlobal0X128)
  // console.log(feeGrowthGlobal1X128)

  // Grab the relative fee growth from the store
  const relativeFeeGrowthX128 = await store.retrieve(`relativeFeeGrowth:${event.address}`, async () => {
    const swap = await Swap.findOne({ address: pool.address }).sort({ block: -1 })
    if (!swap)
      return { token0: 0, token1: 0 }

    return {
      token0: swap.feeGrowthGlobal0X128,
      token1: swap.feeGrowthGlobal1X128,
    }
  })

  const feeAmount0 = amount0 > 0 ? amount0 * BigInt(pool.fee) / BigInt(FEE_DENOM) : 0n
  const feeAmount1 = amount1 > 0 ? amount1 * BigInt(pool.fee) / BigInt(FEE_DENOM) : 0n
  const feeGrowth0 = Number(feeAmount0) * (2 ** 128) / Number(liquidity)
  const feeGrowth1 = Number(feeAmount1) * (2 ** 128) / Number(liquidity)
  relativeFeeGrowthX128.token0 += feeGrowth0
  relativeFeeGrowthX128.token1 += feeGrowth1
  store.set(`relativeFeeGrowth:${event.address}`, relativeFeeGrowthX128)

  const reserves = await getReserves(client, store, event.blockNumber!, event.address)
  reserves.token0 += amount0
  reserves.token1 += amount1
  updateReserves(store, event.address, reserves)

  const decimals0 = pool.tokens[0].decimals
  const decimals1 = pool.tokens[1].decimals
  Swap.create({
    pool,
    address: pool.address,
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
  })
}