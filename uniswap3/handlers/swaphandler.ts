import { fromHex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import { UNIV3_POOL_ABI } from '../abis/UNI3PoolAbi.ts'
import {getBlock } from "./poolhelper.ts"
import { OhlcUtil } from './ohlcutil.ts'

export const onSwap: EventHandlerFor<typeof UNIV3_POOL_ABI, "Swap"> = async (
  { event, client, store }
) => {
  // convert to price
  const { sqrtPriceX96 } = event.args
  const price = numberToHex(sqrtPriceX96)
  const block = await getBlock(client, store, event.blockNumber!)
  const ohlc = await OhlcUtil.get(client, store, Number(block.timestamp), event.address, price)
  
  const high = fromHex(ohlc.high, 'bigint')
  const low = fromHex(ohlc.low, 'bigint')
  
  if (sqrtPriceX96 > high) {
    ohlc.high = price
  }

  if (sqrtPriceX96 < low) { 
    ohlc.low = price
  }

  ohlc.close = price
  ohlc.save()
}