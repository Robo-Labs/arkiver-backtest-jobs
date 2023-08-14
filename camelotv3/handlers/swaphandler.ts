import { fromHex, Hex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import { UNI3PoolAbi } from '../abis/UNI3PoolAbi.ts'
import {getBlock } from "./poolhelper.ts"
import { OhlcUtil } from './ohlcutil.ts'

export const POOLS = [
  '0xb1026b8e7276e7ac75410f1fcbbe21796e8f7526',
]

export const onSwap: EventHandlerFor<typeof UNI3PoolAbi, "Swap"> = async (
  { event, client, store }
) => {
  if(!POOLS.includes(event.address)){
    return
  }

  // convert to price
  const { price } = event.args
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
  ohlc.save()
}