import { type BlockHandler } from 'https://deno.land/x/robo_arkiver@v0.4.21/mod.ts'
import { JOES_V2_ABI } from '../abis/joesv2LpAbi.ts';
import { HourData } from '../entities/hourdata.ts';
import { getPools } from '../utils/pools.ts';
import { Address } from 'npm:abitype';

const HOUR = 60 * 60

const mulShiftRoundDown = (x: bigint, y: bigint, shift: number) => {
  return (x * y) >> BigInt(shift)
}
const split256to128s = (n: bigint, leftDecimals: number, rightDecimals: number) => {
  const mask = (1n << 128n) - 1n
  return [
    toNumber(n >> 128n, leftDecimals), 
    toNumber(n & mask, rightDecimals)
  ]
}

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
    const pools = await getPools(client, store, block.number)
    const abi = JOES_V2_ABI
    const binRange = 20

    const docs = await Promise.all(pools.map(async pool => {
      const address = pool.address as Address
      const activeId = Number(await client.readContract({
        abi, address, functionName: 'getActiveId',
      }))
      const start = activeId - binRange
      const end = activeId + binRange
      const nBins = binRange * 2 + 1
      const contracts = [{ abi, address, functionName: 'getPriceFromId', args: [activeId] }]
      for (let bin = start; bin <= end; bin++) {
        contracts.push({ abi, address, functionName: 'getBin', args: [bin] })
        contracts.push({ abi, address, functionName: 'totalSupply', args: [bin] })
      }

      const [price128x128, ...info] = await client.multicall({
        contracts: contracts as any, 
        blockNumber: block.number
      }).then(res => res.map(e => e.result!))

      const bins = (new Array(nBins).fill(0)).map((e, i) => {
        const [binReserveX, binReserveY] = info[i * 2] as [bigint, bigint]
        const supply = info[i * 2 + 1] as bigint
        return {
          id: start + i,
          reserveX: toNumber(binReserveX, pool.tokenX.decimals),
          reserveY: toNumber(binReserveY, pool.tokenY.decimals),
          supply: toNumber(supply, 36),
        }
      })
      const price = mulShiftRoundDown(price128x128 as bigint, 10n ** 18n, 128)
      const decimals = pool.tokenY.decimals + (18 - pool.tokenX.decimals)

      return new HourData({
        pool: pool.address,
        timestamp: nowHour,
        activeBin: Number(activeId),
        block: Number(block.number),
        price: toNumber(price, decimals),
        bins
      })
    }))
    // console.log(docs)
    await HourData.bulkSave(docs)
    // await 
  }
}
