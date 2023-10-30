import { CamelotAbi } from '../abis/camelotAbi.ts'
import { Erc20Abi } from '../abis/erc20.ts'
import { PublicClient, Address, Store } from '../deps.ts'
import { getPool } from './poolhelper.ts'

export type Reserves = {
  token0: bigint
  token1: bigint
}

export const getReserves = async (
  client: PublicClient, 
  store: Store, 
  blockNumber: bigint, 
  address: Address,
  fetch: boolean = false,
) => {
  const id = `Univ3:Reserves:${address}`
  const reserves = fetch ? undefined : await store.get(id) as Reserves | undefined
  if (!reserves) {
    const pool = await getPool(client, store, address)
    const [
      token0,
      token1,
    ] = await client.multicall({
      contracts: [
        { abi: Erc20Abi, address: pool.tokens[0].address, functionName: "balanceOf", args: [pool.address] },
        { abi: Erc20Abi, address: pool.tokens[1].address, functionName: "balanceOf", args: [pool.address] },
      ],
      blockNumber: blockNumber - 1n,
    })
    const data = {
      token0: token0.result!,
      token1: token1.result!,
    }
    await store.set(id, data)
    return {
      fetched: true,
      ...data,
    }
  }
  return {
    fetched: false,
    ...reserves,
  }
}

export const updateReserves = (store: Store, address: string, reserves: Reserves, ) => {
  const id = `Univ3:Reserves:${address}`
  store.set(id, reserves)
}