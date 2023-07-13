import { Manifest } from 'https://deno.land/x/robo_arkiver@v0.4.17/mod.ts'
import { prices } from './handlers/prices.ts'
import { Price } from './entities/vault.ts'

const manifest = new Manifest('web3-backtest-prices')

manifest
  .addEntity(Price)
  .addChain('arbitrum')
  .addBlockHandler({
    blockInterval: 1000,
    startBlockHeight: 75000000n,
    handler: prices,
  })

export default manifest
  .build()
