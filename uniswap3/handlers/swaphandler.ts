import { formatUnits, fromHex, numberToHex, Address, Hex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import { UNI3PoolAbi } from '../abis/UNI3PoolAbi.ts'
import { Swap } from '../entities/swap.ts'
import {getBlock, getPool, getToken} from "./poolhelper.ts"
import { toNumber } from "./util.ts";
import {TokenPrice} from "./tokenprice.ts"
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

  const { sqrtPriceX96 } = event.args
  const block = await getBlock(client, store, event.blockNumber!)
  const ohlc = await OhlcUtil.get(client, store, Number(block.timestamp), event.address, sqrtPriceX96)
  const high = fromHex(ohlc.high, 'bigint')
  const low = fromHex(ohlc.low, 'bigint')
  if (sqrtPriceX96 > high) ohlc.high = numberToHex(sqrtPriceX96)
  if (sqrtPriceX96 < low) ohlc.low = numberToHex(sqrtPriceX96)
  ohlc.close = sqrtPriceX96
  ohlc.save()
}