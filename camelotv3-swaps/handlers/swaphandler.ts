import { fromHex, Hex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.22/mod.ts'
import { getBlock, getPool } from "./poolhelper.ts"
import { OhlcUtil } from './ohlcutil.ts'
import { CamelotAbi } from '../abis/camelotAbi.ts'
import { snapshot } from './hourdata.ts'
import { Erc20Abi } from '../abis/erc20.ts'

export const POOLS = [
  '0xb1026b8e7276e7ac75410f1fcbbe21796e8f7526',
]
type Fee = {
  feeZto: number;
  feeOtz: number;
}
type TotalFeeGrowth = {
  feeGrowthGlobal0X128: number;
  feeGrowthGlobal1X128: number;
}

export const onSwap: EventHandlerFor<typeof CamelotAbi, "Swap"> = async (
  { event, client, store }
) => {
  const { amount0, amount1, liquidity, price, recipient, sender, tick } = event.args
  const fee = store.get(`fee:${event.address}`) as Fee
  const pool = await getPool(client, store, event.address)

  const lastTotalFeeGrowth = store.get(`totalFeeGrowth:${event.address}`) as TotalFeeGrowth | undefined
  console.log(`swap - block: ${event.blockNumber}`)

  const [
    feeGrowthGlobal0X128,
    feeGrowthGlobal1X128,
    totalValueLockedToken0,
    totalValueLockedToken1,
  ] = await client.multicall({
    contracts: [
      { abi: CamelotAbi, address: pool.address, functionName: "totalFeeGrowth0Token" },
      { abi: CamelotAbi, address: pool.address, functionName: "totalFeeGrowth1Token" },
      { abi: Erc20Abi, address: pool.tokens[0].address, functionName: "balanceOf", args: [pool.address] },
      { abi: Erc20Abi, address: pool.tokens[1].address, functionName: "balanceOf", args: [pool.address] },
    ],
    blockNumber: event.blockNumber!,
    // multicallAddress,
  }).then(e => e.map(i => i.result!))

  const totalFeeGrowth = {
    feeGrowthGlobal0X128: Number(feeGrowthGlobal0X128) / Math.pow(2, 128),
    feeGrowthGlobal1X128: Number(feeGrowthGlobal1X128) / Math.pow(2, 128)
  }
  store.set(`totalFeeGrowth:${event.address}`, totalFeeGrowth)

  // console.log(lastTotalFeeGrowth, totalFeeGrowth)
  if (lastTotalFeeGrowth) {
    const diff0 = totalFeeGrowth.feeGrowthGlobal0X128 - lastTotalFeeGrowth.feeGrowthGlobal0X128
    const diff1 = totalFeeGrowth.feeGrowthGlobal1X128 - lastTotalFeeGrowth.feeGrowthGlobal1X128
    // console.log({diff0, diff1})  

    const totalFees0 = (diff0 * Number(liquidity)) / 1e18;
    const totalFees1 = (diff1 * Number(liquidity)) / 1e6;
    console.log({totalFees0, totalFees1})
  }
  // console.log({amount0, amount1})

  const communityFee = 150
  const communityFeeScale = (1e3 - communityFee) / 1e3
  const totalFees0 = amount0 > 0 ? ((Number(amount0) * fee.feeOtz / (1e6 - fee.feeOtz)) * communityFeeScale) / 1e18 : 0
  const totalFees1 = amount1 > 0 ? ((Number(amount1) * fee.feeZto / (1e6 - fee.feeZto)) * communityFeeScale) / 1e6  : 0
  console.log({totalFees0, totalFees1})

}