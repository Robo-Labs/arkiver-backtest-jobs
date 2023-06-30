import { formatUnits, fromHex, numberToHex, toHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import { UNI3PoolAbi } from '../abis/UNI3PoolAbi.ts'
import {UniV3NFTManagerAbi} from '../abis/UniV3NFTManagerAbi.ts'
import { UniV3FactoryAbi } from '../abis/UniV3FactoryAbi.ts'
import { Swap } from '../entities/swap.ts'
import {getPool, getToken} from "./poolhelper.ts"
import { toNumber } from "./util.ts";
import { AmmPool } from '../entities/ammpool.ts'
import { computePoolAddress } from "npm:@uniswap/v3-sdk"
import {Token} from "npm:@uniswap/sdk";
import {TokenPrice} from "./tokenprice.ts"

export const POOLSYMBOLS = {'0x4e0924d3a751be199c426d52fb1f2337fa96f736': 'UNI3-LUSD/USDC 0.05%'}
const UNI3FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984"

      //const mintHandler: EventHandlerFor<typeof SolidlyPairAbi, "Mint">
export const onIncreaseLiquidity: EventHandlerFor<typeof UniV3NFTManagerAbi, "IncreaseLiquidity"> = async (
    { event, client, store }
  ) => {
    // const start = Date.now()
    const { tokenId, liquidity, amount0, amount1 } = event.args
    const chainId = await store.retrieve(`chainId:uni3`, async() => {
      return await client.getChainId()
    })
    const poolAddress = await store.retrieve(`${chainId}:uni3:${tokenId}`, async() => {
      const [,, token0Address, token1Address, fee] = await client.readContract({
        abi: UniV3NFTManagerAbi,
        address: event.address,
        functionName: "positions",
        args: [tokenId],
        blockNumber: event.blockNumber
      })
      const token0 = await getToken(client, 'ethereum', token0Address)
      const token1 = await getToken(client, 'ethereum', token1Address)
      // const poolAddress = await client.readContract({
      //   abi: UniV3FactoryAbi,
      //   address: UNI3FACTORY,
      //   functionName: "getPool",
      //   args: [token0Address, token1Address, fee],
      //   blockNumber: event.blockNumber
      // })
      const token0Obj = new Token(
        chainId,
        token0Address,
        token0.decimals,
        token0.symbol,
        token0.symbol
      )

      const token1Obj = new Token(
        chainId,
        token1Address,
        token1.decimals,
        token1.symbol,
        token1.symbol
      )

      const poolAddress = computePoolAddress({
        factoryAddress: UNI3FACTORY,
        tokenA: token0Obj,
        tokenB: token1Obj,
        fee: fee,
      })
      //console.log(`modliq pool: ${poolAddress}`)
      return poolAddress
    })
    // const end = Date.now()
    //console.log(`time to reject: ${end-start}`)

    if(!POOLSYMBOLS[poolAddress]){
      return
    }
    console.log("IncreaseLiquidity")
    const pool = await getPool(client, poolAddress, POOLSYMBOLS[poolAddress])
    const block = Number(event.blockNumber)
    //console.log(`price business`)
    const [token0, token1] = await store.retrieve(`${poolAddress}:tokens`, async () => {
      const [token0Address, token1Address] = await Promise.all([
        client.readContract({
          abi: UNI3PoolAbi,
          address: poolAddress,
          functionName: "token0"
        }),
        client.readContract({
          abi: UNI3PoolAbi,
          address: poolAddress,
          functionName: "token1"
        })])
        const token0 = await getToken(client, 'ethereum', token0Address)
        const token1 = await getToken(client, 'ethereum', token1Address)
        return [token0, token1]
    })
   //poolRecord.totalValueLockedUSD
  //  const totalValueLockedToken0 = pool.totalValueLockedToken0 ? pool.totalValueLockedToken0 : 0
  //  const totalValueLockedToken1 = pool.totalValueLockedToken1 ? pool.totalValueLockedToken1 : 0

  //   pool.totalValueLockedToken0 = totalValueLockedToken0 + toNumber(amount0, token0.decimals)
  //   pool.totalValueLockedToken1 = totalValueLockedToken1 + toNumber(amount1, token1.decimals)
    const totalValueLockedToken0 = pool.totalValueLockedToken0 ? fromHex(pool.totalValueLockedToken0, 'bigint') : 0n
    const totalValueLockedToken1 = pool.totalValueLockedToken1 ? fromHex(pool.totalValueLockedToken1, 'bigint') : 0n
    pool.totalValueLockedToken0 = totalValueLockedToken0 + amount0
    pool.totalValueLockedToken1 = totalValueLockedToken1 + amount1
    const token0Price = await TokenPrice.get(client, store, event.blockNumber, token0)
    const token1Price = await TokenPrice.get(client, store, event.blockNumber, token1)
    pool.totalValueLockedUSD = (toNumber(fromHex(pool.totalValueLockedToken0, 'bigint'), pool.tokens[0].decimals) * token0Price) + (toNumber(fromHex(pool.totalValueLockedToken1, 'bigint'), pool.tokens[1].decimals) * token1Price)
    await pool.save()
}

export const onDecreaseLiquidity: EventHandlerFor<typeof UniV3NFTManagerAbi, "DecreaseLiquidity"> = async (
  { event, client, store }
) => {
  // const start = Date.now()
  const { tokenId, liquidity, amount0, amount1 } = event.args
  const chainId = await store.retrieve(`chainId:uni3`, async() => {
    return await client.getChainId()
  })
  const poolAddress = await store.retrieve(`${chainId}:uni3:${tokenId}`, async() => {
    const [,, token0Address, token1Address, fee] = await client.readContract({
      abi: UniV3NFTManagerAbi,
      address: event.address,
      functionName: "positions",
      args: [tokenId],
      blockNumber: event.blockNumber!
    })
    // const poolAddress = await client.readContract({
    //   abi: UniV3FactoryAbi,
    //   address: UNI3FACTORY,
    //   functionName: "getPool",
    //   args: [token0Address, token1Address, fee],
    //   blockNumber: event.blockNumber!
    // })
    const token0 = await getToken(client, 'ethereum', token0Address)
    const token1 = await getToken(client, 'ethereum', token1Address)

    const token0Obj = new Token(
      chainId,
      token0Address,
      token0.decimals,
      token0.symbol,
      token0.symbol
    )

    const token1Obj = new Token(
      chainId,
      token1Address,
      token1.decimals,
      token1.symbol,
      token1.symbol
    )
    const poolAddress = computePoolAddress({
      factoryAddress: UNI3FACTORY,
      tokenA: token0Obj,
      tokenB: token1Obj,
      fee: fee,
    })
    //console.log(`modliq pool: ${poolAddress}`)
    //console.log(`modliq pool: ${poolAddress}`)
    return poolAddress
  })
  // const end = Date.now()
  // console.log(`time to reject: ${end-start}`)
  if(!POOLSYMBOLS[poolAddress]){
    return
  }
  console.log("DecreaseLiquidity")
  const pool = await getPool(client, poolAddress, POOLSYMBOLS[poolAddress])
  const block = Number(event.blockNumber)
  //console.log(`price business`)
  const [token0, token1] = await store.retrieve(`${poolAddress}:tokens`, async () => {
    const [token0Address, token1Address] = await Promise.all([
      client.readContract({
        abi: UNI3PoolAbi,
        address: poolAddress,
        functionName: "token0"
      }),
      client.readContract({
        abi: UNI3PoolAbi,
        address: poolAddress,
        functionName: "token1"
      })])
      const token0 = await getToken(client, 'ethereum', token0Address)
      const token1 = await getToken(client, 'ethereum', token1Address)
      return [token0, token1]
  })
  //poolRecord.totalValueLockedUSD
  // const totalValueLockedToken0 = pool.totalValueLockedToken0 ? pool.totalValueLockedToken0 : 0
  // const totalValueLockedToken1 = pool.totalValueLockedToken1 ? pool.totalValueLockedToken1 : 0
  // pool.totalValueLockedToken0 = totalValueLockedToken0 - toNumber(amount0, token0.decimals)
  // pool.totalValueLockedToken1 = totalValueLockedToken1 - toNumber(amount1, token1.decimals)
  const totalValueLockedToken0 = pool.totalValueLockedToken0 ? fromHex(pool.totalValueLockedToken0, 'bigint') : 0n
  const totalValueLockedToken1 = pool.totalValueLockedToken1 ? fromHex(pool.totalValueLockedToken1, 'bigint') : 0n
  pool.totalValueLockedToken0 = numberToHex(totalValueLockedToken0 + amount0)
  pool.totalValueLockedToken1 = numberToHex(totalValueLockedToken1 + amount1)
  const token0Price = await TokenPrice.get(client, store, event.blockNumber, token0)
  const token1Price = await TokenPrice.get(client, store, event.blockNumber, token1)
  pool.totalValueLockedUSD = (toNumber(fromHex(pool.totalValueLockedToken0, 'bigint'), pool.tokens[0].decimals) * token0Price) + (toNumber(fromHex(pool.totalValueLockedToken1, 'bigint'), pool.tokens[1].decimals) * token1Price)
  await pool.save()
}

