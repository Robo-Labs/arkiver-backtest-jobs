import { Address, PublicClient } from "npm:viem";
import { ERC20_ABI } from "../abis/erc20.ts";
import { Pool } from "../entities/pool.ts";
import { Store } from "../deps.ts";
import { Token } from "../entities/token.ts";
import { AUTOPOOL_ABI } from "../abis/autopool.ts";

const AUTOPOOLS = [
  { address: '0x32833a12ed3Fd5120429FB01564c98ce3C60FC1d' as const, startBlock: 30100000n },
  { address: '0x1c739a43606794849750c50bc7c43fbbdacdf801' as const, startBlock: 32727010n },
  { address: '0x6178de6e552055862cf5c56310763eec0145688d' as const, startBlock: 32727010n },
] as const

export const getPools = async (client: PublicClient, store: Store, block: bigint) => {
  return await store.retrieve(`Joes Pools`, async () => {
    const records = await Pool.find({}).populate('tokenX tokenY')
    if (records.length > 0)
      return records

    // Otherwise populate the array offchain
    const activePools = AUTOPOOLS.filter(e => e.startBlock < block).map(e => e.address)
    const pools = await Promise.all(activePools.map(async pool => {
      const abi = AUTOPOOL_ABI
      
      const [ tokenX, tokenY, oracleX, oracleY ] = await client.multicall({
        contracts: [
          { abi, address: pool, functionName: 'getTokenX' },
          { abi, address: pool, functionName: 'getTokenY' },
          { abi, address: pool, functionName: 'getOracleX' },
          { abi, address: pool, functionName: 'getOracleY' },
        ],
        blockNumber: block,
      }).then(res => res.map(e => e.result!))
      const tokens = await getTokens(client, [tokenX, tokenY]) as any[]

      return new Pool({
        address: pool,
        symbol: `${tokens[0].symbol}-${tokens[1].symbol}`,
        tokenX: tokens[0],
        tokenY: tokens[1],
        oracleX,
        oracleY,
      })
    }))
    await Pool.bulkSave(pools)
    return pools
  })
}


export const getTokens = async (client: PublicClient, tokens: Address[]) => {
  // check if it's already in the db
  const record = await Token.findOne({ address: { $in: tokens } })
  if (record)
    return record

  // get the pair data.. todo, add symbol
  const data = await client.multicall({
    contracts: tokens.map(address => [
      { 
        address: address, 
        abi: ERC20_ABI, 
        functionName: 'decimals',
      },
      { 
        address: address, 
        abi: ERC20_ABI, 
        functionName: 'symbol',
      }
    ]).flat()
  }).then(res => res.map(e => e.result!))
  
  const network = client.chain?.name as string
  const docs = tokens.map((address, i) => new Token({
    address: address,
    network,
    decimals: Number(data[i * 2]),
    symbol: data[i * 2 + 1],
  }))
  Token.bulkSave(docs)
  return docs
}