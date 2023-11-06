import { Manifest } from "https://deno.land/x/robo_arkiver@v0.4.22/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { UNIV3_POOL_ABI } from "./abis/UNI3PoolAbi.ts"
import { onSwap } from "./handlers/swaphandler.ts"
import { Ohlc } from "./entities/ohlc.ts";

const startBlockHeight = 64270600n;//40000000n 

const manifest = new Manifest('univ3-ohlc-arb');
manifest
	.addEntities([AmmPool, Token, Snapshot, Ohlc])
  .addChain("arbitrum", (chain) => chain
    .addBlockHandler({ blockInterval: 500, startBlockHeight, handler: hourDataHandler })
    .addContract({
      name: 'UNI3PoolAbi',
      abi: UNIV3_POOL_ABI,
      sources: { 
        '0xc31e54c7a869b9fcbecc14363cf510d1c41fa443': startBlockHeight, // WETH/USDC
        '0x35218a1cbac5bbc3e57fd9bd38219d37571b3537': startBlockHeight, // wstETH/WETH
      },
      eventHandlers: {
        'Swap': onSwap,
      }
    })
  )
	


export default manifest.build();