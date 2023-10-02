import { type BlockHandler } from 'https://deno.land/x/robo_arkiver@v0.4.21/mod.ts'
import { HourData } from '../entities/hourdata.ts';
import { Address, toHex } from 'npm:viem';
import { AUTOPOOL_ABI } from "../abis/autopool.ts";
import { getPools } from "../utils/pools.ts";
import { ORACLE } from "../abis/oracle.ts";

const HOUR = 60 * 60

const nearestHour = (now: number) => {
  return Math.floor(now / HOUR) * HOUR
}

const toNumber = (n: bigint, decimals: number = 0) => {
  return Number(n) / (10 ** decimals)
}

export const snapshotBins: BlockHandler = async ({
  block,
  client,
  store,
  logger,
}): Promise<void> => {
  const now = Number(block.timestamp)
  const nowHour = nearestHour(Number(now))
  const last = await HourData.findOne({}).sort({ timestamp: -1 })
  const lastHour = last?.timestamp ?? (nearestHour(now) - HOUR)

  if (lastHour < nowHour) {
    logger.info(`Taking snapshot for block: ${block.number} at ${now}`)
    const abi = AUTOPOOL_ABI

    const pools = await getPools(client, store, block.number)
    const docs = await Promise.all(pools.map(async pool => {
      const [priceX, priceY] = await client.multicall({
        contracts: [
          { abi: ORACLE, address: pool.oracleX as Address, functionName: 'latestAnswer', },
          { abi: ORACLE, address: pool.oracleY as Address, functionName: 'latestAnswer', },
        ],
        blockNumber: block.number,
      }).then(res => res.map(e => toNumber(e.result!, 8)))
      const pairPrice = priceX / priceY

      const amount = 10 ** pool.tokenX.decimals
      const args: [bigint, bigint] = [ BigInt(amount), BigInt(Math.floor(amount * pairPrice))]
      const [ price, sharesPreview ] = await client.multicall({
        contracts: [ 
          { abi, address: pool.address as Address, functionName: 'getPrice' },
          { abi, address: pool.address as Address, functionName: 'previewShares', args },
        ],
        blockNumber: block.number
      })
      const snap = {
        pool: pool,
        priceX,
        priceY,
        sharesPreview: toNumber(sharesPreview.result![0], 18),
        timestamp: nowHour,
        block: Number(block.number),
        price: toNumber(price.result!, 18)
      }
      return new HourData(snap)
    }))

    await HourData.bulkSave(docs)
  }
}
