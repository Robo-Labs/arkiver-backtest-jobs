import { fromHex, Hex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import { UNI3PoolAbi } from '../abis/UNI3PoolAbi.ts'
import {getBlock } from "./poolhelper.ts"
import { OhlcUtil } from './ohlcutil.ts'

export const POOLS = [
  '0x4e0924d3a751be199c426d52fb1f2337fa96f736',
]

export const onSwap: EventHandlerFor<typeof UNI3PoolAbi, "Swap"> = async (
  { event, client, store }
) => {
  if(!POOLS.includes(event.address)){
    return
  }

  // convert to price
  const { sqrtPriceX96 } = event.args
  const price = numberToHex(sqrtPriceX96) // sqrtPriceX96 = uint160
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