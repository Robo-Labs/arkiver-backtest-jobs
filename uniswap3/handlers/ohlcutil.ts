import { type PublicClient, type Address } from "npm:viem";
import { Ohlc } from "../entities/ohlc.ts";
import { getPool } from "./poolhelper.ts";
import { Store } from "../deps.ts";

const HOUR = 60 * 60
const nearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

const range = (size: number) => {
  return Array.from(Array(size).keys())
}

const createOhcl = async (client: PublicClient, store: Store, pair: Address, price: string, timestamp: number) => {
  return new Ohlc({
    pool: await getPool(client, store, pair),
    address: pair,
    timestamp,
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 0
  })
}

export class OhlcUtil {
  static async get(client: PublicClient, store: Store, timestamp: number, pair: Address, sqrtPriceX96: string) {
    const nowHour = nearestHour(Number(timestamp));
    // this can be optimised further by caching the hour data
    const now = await Ohlc.findOne({ address: pair, timestamp: nowHour })
    if (now) return now

    const latest = await Ohlc.findOne({ address: pair }).sort({ timestamp: -1})
    if (!latest) {
      // this is the first one
      return await createOhcl(client, store, pair, sqrtPriceX96, nowHour)
    }

    // Gap fill
    const gaps = (nowHour - latest.timestamp) / HOUR
    const timestamps = range(gaps).map(e => latest.timestamp + HOUR + (e * HOUR))
    const ohlcs = await Promise.all(timestamps.map(async (timestamp: number) => {
      return await createOhcl(client, store, pair, latest.close, timestamp)
    }))
    await Ohlc.bulkSave(ohlcs)
    return ohlcs[ohlcs.length - 1]
  }

  static async getOrGapFill(client: PublicClient, store: Store, timestamp: number, pair: Address) {
    // this can be optimised further by caching the hour data
    const now = await Ohlc.findOne({ address: pair, timestamp })
    if (now) return now

    const latest = await Ohlc.findOne({ address: pair }).sort({ timestamp: -1})
    if (!latest) {
      return null // cannot start from here
    }

    // Gap fill
    const gaps = (timestamp - latest.timestamp) / HOUR
    const timestamps = range(gaps > 0 ? gaps : 1).map(e => latest.timestamp + HOUR + (e * HOUR))
    const ohlcs = await Promise.all(timestamps.map(async (timestamp: number) => {
      return await createOhcl(client, store, pair, latest.close, timestamp)
    }))
    await Ohlc.bulkSave(ohlcs)
    return ohlcs[ohlcs.length - 1]
  }
}
