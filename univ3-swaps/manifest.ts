import { Manifest } from "https://deno.land/x/robo_arkiver@v0.4.22/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { CamelotAbi } from "./abis/camelotAbi.ts"
import { onSwap } from "./handlers/swaphandler.ts"
import { onFee } from './handlers/feehandler.ts'
import { onBurn, onMint, onFlash } from './handlers/mintandburn.ts'
import { Swap } from './entities/swap.ts'
import { UNIV3_POOL_ABI } from './abis/UNI3PoolAbi.ts'

const startBlockHeight = 17000000n
const manifest = new Manifest('univ3-swaps')
  .addEntities([AmmPool, Token, Swap])
  .addChain("arbitrum", (chain) => chain
    .setOptions({ blockRange: 2999n })
    // .addBlockHandler({ blockInterval: 2000, startBlockHeight, handler: hourDataHandler })
    .addContract({
      name: 'Univ3Pool',
      abi: UNIV3_POOL_ABI, 
      sources: { 
        '0xc31e54c7a869b9fcbecc14363cf510d1c41fa443': 34000000n, // ETH-USDC
        '0x2f5e87c9312fa29aed5c179e456625d79015299c': 34000000n, // WBTC-ETH
        '0xc6f780497a95e246eb9449f5e4770916dcd6396a': 70590940n, // ETH-ARB
        '0x7cf803e8d82a50504180f417b8bc7a493c0a0503': 101196671n, // USDC-DAI
      },
      eventHandlers: {
        'Swap': onSwap,
        // 'Fee': onFee,
        'Burn': onBurn,
        'Mint': onMint,
        'Flash': onFlash,
      }
    })
  )

export default manifest.build();