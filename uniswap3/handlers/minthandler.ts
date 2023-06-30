import { formatUnits, fromHex, numberToHex, toHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import { UNI3PoolAbi } from '../abis/UNI3PoolAbi.ts'
import {UniV3NFTManagerAbi} from '../abis/UniV3NFTManagerAbi.ts'
import { Swap } from '../entities/swap.ts'
import {getPool, getToken} from "./poolhelper.ts"
import { toNumber } from "./util.ts";
import { AmmPool } from '../entities/ammpool.ts'
import {TokenPrice} from './tokenprice.ts'

export const POOLSYMBOLS = {'0x4e0924d3a751be199c426d52fb1f2337fa96f736': 'UNI3-LUSD/USDC 0.05%'}

      //const mintHandler: EventHandlerFor<typeof SolidlyPairAbi, "Mint">
export const onMint: EventHandlerFor<typeof UNI3PoolAbi, "Mint"> = async (
    { event, client, store }
  ) => {
    if(!POOLSYMBOLS[event.address]){
      return
    }
    //console.log("mint")
    const { sender, owner, tickLower, tickUpper, amount, amount0, amount1 } = event.args
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
   //poolRecord.totalValueLockedUSD
    // pool.totalValueLockedToken0 = totalValueLockedToken0 + toNumber(amount0, token0.decimals)
    // pool.totalValueLockedToken1 = totalValueLockedToken1 + toNumber(amount1, token1.decimals)
    const totalValueLockedToken0 = pool.totalValueLockedToken0 ? fromHex(pool.totalValueLockedToken0, 'bigint') : 0n
    const totalValueLockedToken1 = pool.totalValueLockedToken1 ? fromHex(pool.totalValueLockedToken1, 'bigint') : 0n
    pool.totalValueLockedToken0 = numberToHex(totalValueLockedToken0 + amount0)
    pool.totalValueLockedToken1 = numberToHex(totalValueLockedToken1 + amount1)

    const token0Price = await TokenPrice.get(client, store, event.blockNumber, token0)
    const token1Price = await TokenPrice.get(client, store, event.blockNumber, token1)
    pool.totalValueLockedUSD = (toNumber(fromHex(pool.totalValueLockedToken0, 'bigint'), pool.tokens[0].decimals) * token0Price) + (toNumber(fromHex(pool.totalValueLockedToken1, 'bigint'), pool.tokens[1].decimals) * token1Price)
    await pool.save()
}