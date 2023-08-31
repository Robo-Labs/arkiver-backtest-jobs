import { Address, PublicClient } from "npm:viem";
import { ERC20_ABI } from "../abis/erc20.ts";
import { Pool } from "../entities/pool.ts";
import { Store } from "../deps.ts";
import { JOES_V2_ABI } from "../abis/joesv2LpAbi.ts";
import { Token } from "../entities/token.ts";

const POOLS = [
  '0xD446eb1660F766d533BeCeEf890Df7A69d26f7d1', // AVAX-USDC
  '0xD9fa522F5BC6cfa40211944F2C8DA785773Ad99D', // BTC.b-AVAX
  '0x1901011a39B11271578a1283D620373aBeD66faA', // WETH.e-AVAX
] as Address[]

export const getPools = async (client: PublicClient, store: Store, block: bigint) => {
  return await store.retrieve(`Joes Pools`, async () => {
    const records = await Pool.find({}).populate('tokenX tokenY')
    if (records.length > 0)
      return records
    console.log('here')
    // Otherwise populate the array offchain
    const pools = await Promise.all(POOLS.map(async pool => {
      const abi = JOES_V2_ABI
      
      const tokens = await client.multicall({
        contracts: [
          { abi, address: pool, functionName: 'getTokenX' },
          { abi, address: pool, functionName: 'getTokenY' },
        ],
        blockNumber: block,
      }).then(res => res.map(e => e.result!))
      const [tokenX, tokenY] = await getTokens(client, tokens) as any[]

      return new Pool({
        address: pool,
        symbol: `${tokenX.symbol}-${tokenY.symbol}`,
        tokenX,
        tokenY,
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