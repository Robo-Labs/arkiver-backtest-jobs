import { formatUnits } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import { UNI3PoolAbi } from '../abis/UNI3PoolAbi.ts'
import { Swap } from '../entities/swap.ts'
import {getPool, getToken} from "./poolhelper.ts"
import { toNumber } from "./util.ts";

export const POOLSYMBOLS = {'0x4e0924d3a751be199c426d52fb1f2337fa96f736': 'UNI3-LUSD/USDC 0.05%'}

      //const mintHandler: EventHandlerFor<typeof SolidlyPairAbi, "Mint">
export const onSwap: EventHandlerFor<typeof UNI3PoolAbi, "Swap"> = async (
    { event, client, store, block }
  ) => {
    console.log("swap")
    const { sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick } = event.args
    const pool = await getPool(client, event.address, POOLSYMBOLS[event.address])
    const block = Number(event.blockNumber)
    //console.log(`price business`)
    const [token0, token1] = await store.retrieve(`${event.address}:tokens`, async () => {
      const [token0Address, token1Address] = await Promise.all([
        client.readContract({
          abi: UNI3PoolAbi,
          address: event.address,
          functionName: "token0"
        }),
        client.readContract({
          abi: UNI3PoolAbi,
          address: event.address,
          functionName: "token1"
        })])
        const token0 = await getToken(client, 'ethereum', token0Address)
        const token1 = await getToken(client, 'ethereum', token1Address)
        return [token0, token1]
    })

    const amount0Normal = Math.abs(toNumber(amount0)) / (10 ** token0.decimals)
    const amount1Normal = Math.abs(toNumber(amount1)) / (10 ** token1.decimals)
    const amount0Real = toNumber(amount0) / (10 ** token0.decimals)
    const amount1Real = toNumber(amount1) / (10 ** token1.decimals)
    //console.log(`amount0Normal: ${amount0Normal}`)
    //console.log(`amount1Normal: ${amount1Normal}`)
    const price0 = (amount0Normal/amount1Normal)
    const price1 = (amount1Normal/amount0Normal)
    //console.log(`price0: ${price0}`)
    //console.log(`price1: ${price1}`)
    const record = new Swap({
      pool,
      hash: event.transactionHash,
      timestamp: Number(Date.now()), // TODO: query block timestamp
      block,
      sender,
      recipient,
      amount0: amount0Real,
      amount1: amount1Real,
      price0,
      price1,
      sqrtPriceX96: toNumber(sqrtPriceX96).toString(),
      liquidity: toNumber(liquidity),
      tick
    })
    record.save()
}