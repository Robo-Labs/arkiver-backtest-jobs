import { Manifest } from 'https://deno.land/x/robo_arkiver@v0.4.21/mod.ts'
import { JOES_V2_ABI } from './abis/joesv2LpAbi.ts';
import { onSwap } from './handlers/onSwap.ts';
import { snapshotBins } from './handlers/snapshot.ts';
import { HourData } from './entities/hourdata.ts';
import { Pool } from './entities/pool.ts';
import { Token } from './entities/token.ts';

const WETHUSDC_LP = '0xD446eb1660F766d533BeCeEf890Df7A69d26f7d1' as const

const manifest = new Manifest('joes-v2-lp')

manifest
  .addEntities([HourData, Pool, Token])
  .addChain('avalanche', (chain) => chain
    .setOptions({ blockRange: 2047n })
    // .addContract({
    //   name: 'JoesV2LP',
    //   abi: JOES_V2_ABI,
    //   sources: { [WETHUSDC_LP]: 29154475n },
    //   eventHandlers: { 'Swap': onSwap }
    // })
    .addBlockHandler({
      blockInterval: 100,
      startBlockHeight: 30000000n, //29154475n,
      handler: snapshotBins,
    })
  )
  

export default manifest.build()
