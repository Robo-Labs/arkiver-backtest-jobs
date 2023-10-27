import { Manifest } from "https://deno.land/x/robo_arkiver@v0.4.22/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { CamelotAbi } from "./abis/camelotAbi.ts"
import { onSwap } from "./handlers/swaphandler.ts"
import { onFee } from './handlers/feehandler.ts'
import { onBurn, onMint } from './handlers/mintandburn.ts'
import { Swap } from './entities/swap.ts'

const startBlockHeight =  103178000n
const manifest = new Manifest('camelot-snapshot-all-swaps-v3')
  .addEntities([AmmPool, Token, Swap])
  .addChain("arbitrum", (chain) => chain
    // .addBlockHandler({ blockInterval: 2000, startBlockHeight, handler: hourDataHandler })
    .addContract({
      name: 'CamelotAbi',
      abi: CamelotAbi, 
      sources: { 
        '0xB1026b8e7276e7AC75410F1fcbbe21796e8f7526': startBlockHeight
      },
      eventHandlers: {
        'Swap': onSwap,
        'Fee': onFee,
        'Burn': onBurn,
        'Mint': onMint,
      }
    })
  )

export default manifest.build();