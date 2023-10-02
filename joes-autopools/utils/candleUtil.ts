import { type PublicClient, type Address, type Block } from "npm:viem";
import { Store } from "https://deno.land/x/robo_arkiver/mod.ts";
import { Candle } from "../entities/entities.ts";

const HOUR = 60 * 60
const nearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

const range = (size: number) => {
  return Array.from(Array(size).keys())
}

const createOhcl = (pair: Address, price: number, timestamp: number) => {
  return new Candle({
    address: pair,
    res: '1h',
    timestamp,
    open: price,
    high: price,
    low: price,
    close: price,
    vol: 0
  })
}

export class CandleUtil {
  static async get(client: PublicClient, store: Store, timestamp: number, pair: Address, price: number) {
    const nowHour = nearestHour(timestamp)
  
    const now = await Candle.findOne({ address: pair, timestamp: nowHour })
    if (now) 
      return now

    const latest = await Candle.findOne({ address: pair }).sort({ timestamp: -1})
    if (!latest) {
      // this is the first one
      return await createOhcl(pair, price, nowHour)
    }

    // Gap fill
    const gaps = (nowHour - latest.timestamp) / HOUR
    const timestamps = range(gaps).map(e => latest.timestamp + HOUR + (e * HOUR))
    const candles = await Promise.all(timestamps.map(async (timestamp: number) => {
      return await createOhcl(pair, latest.close, timestamp)
    }))
    await Candle.bulkSave(candles)
    return candles[candles.length - 1]
  }
}