import { fromHex, Hex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.22/mod.ts'
import { getBlock, getPool } from "./poolhelper.ts"
import { OhlcUtil } from './ohlcutil.ts'
import { CamelotAbi } from '../abis/camelotAbi.ts'
import { snapshot } from './hourdata.ts'

export const POOLS = [
  '0xb1026b8e7276e7ac75410f1fcbbe21796e8f7526',
]

let swapBlock: bigint | null = null
export const onSwap: EventHandlerFor<typeof CamelotAbi, "Swap"> = async (
  { event, client, store }
) => {
  // convert to price
  const { price, liquidity } = event.args
  const priceHex = numberToHex(price)
  const block = await getBlock(client, store, event.blockNumber!)
  const ohlc = await OhlcUtil.get(client, store, Number(block.timestamp), event.address, priceHex)
  const high = fromHex(ohlc.high, 'bigint')
  const low = fromHex(ohlc.low, 'bigint')
  
  if (price > high) {
    ohlc.high = priceHex
  }
  if (price < low) { 
    ohlc.low = priceHex
  }

  ohlc.close = priceHex
  await ohlc.save()

  if (!swapBlock) {
    swapBlock = event.blockNumber! - 1n
  }

  if (event.blockNumber! > swapBlock) {
    swapBlock = event.blockNumber!
    const pool = await getPool(client, store, event.address)
    const snap = await snapshot({ client, store, block, timestamp: Number(block.timestamp), pool, liquidity })
    await snap?.save()
  }
}