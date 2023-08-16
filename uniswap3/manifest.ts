import { Manifest } from "https://deno.land/x/robo_arkiver@v0.4.21/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { UNI3PoolAbi } from "./abis/UNI3PoolAbi.ts"
import { onSwap } from "./handlers/swaphandler.ts"
import { Ohlc } from "./entities/ohlc.ts";

const startBlockHeight = 50000000n 
const POOL_USDC_WETH_500 = '0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443'

const manifest = new Manifest('univ3-ohlc');
const arbitrum = manifest
  .addEntities([AmmPool, Token, Snapshot, Ohlc])
  .addChain("arbitrum", { blockRange: 500n })
  
  
// Hourly data handler
arbitrum
  .addBlockHandler({ blockInterval: 2000, startBlockHeight, handler: hourDataHandler })

arbitrum
  .addContract({
    abi: UNI3PoolAbi,
    name: 'UNI3PoolAbi',
    sources: {
      [POOL_USDC_WETH_500]: startBlockHeight
    },
    eventHandlers: {
      Swap: onSwap
    }
  })

export default manifest.build();