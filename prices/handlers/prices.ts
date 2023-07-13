import { type BlockHandler } from 'https://deno.land/x/robo_arkiver@v0.4.17/mod.ts'
import { Price } from '../entities/vault.ts'
import { TokenPrice } from '../util/tokenPrice.ts'

const WETH = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
const ARB = '0x912CE59144191C1204E64559FE8253a0e49E6548'

export const prices: BlockHandler = async ({
  block,
  client,
  store,
}): Promise<void> => {
  const [ arb, eth ] = await TokenPrice.getPrices(client, store, block.number, [ ARB, WETH ])
  const prices = {
    'ETH/USDC': eth,
    'ARB/USDC': arb,
    'ARB/ETH': arb / eth,
  }
  await Price.create({
    block: Number(block.number),
    timestamp: Number(block.timestamp),
    prices,
  })
}
