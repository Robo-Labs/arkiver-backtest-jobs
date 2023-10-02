import { Manifest } from 'https://deno.land/x/robo_arkiver@v0.4.21/mod.ts'
import { snapshotBins } from './handlers/snapshot.ts';
import { HourData } from './entities/hourdata.ts';
import { Pool } from './entities/pool.ts';
import { Token } from './entities/token.ts';

const WETHUSDC_LP = '0xD446eb1660F766d533BeCeEf890Df7A69d26f7d1' as const

const manifest = new Manifest('joes-autopools')

manifest
  .addEntities([HourData, Pool, Token])
  .addChain('avalanche', (chain) => chain
    .setOptions({ blockRange: 2047n })
    .addBlockHandler({
      blockInterval: 100,
      startBlockHeight: 30200000n,
      handler: snapshotBins,
    })
  )
  

export default manifest.build()
