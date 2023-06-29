import { Manifest } from "https://deno.land/x/robo_arkiver/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { Swap } from "./entities/swap.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { FarmSnapshot } from "./entities/farmsnapshot.ts";
import { UNI3PoolAbi } from "./abis/UNI3PoolAbi.ts"
import { onSwap } from "./handlers/swaphandler.ts"


const startBlockHeight = 17542150n // enough to test
const manifest = new Manifest('uniswapV3-1');
const mainnet = manifest
	.addEntities([AmmPool, Token, Snapshot, FarmSnapshot, Swap])
	.chain("mainnet")
	
	

// Hourly data handler
mainnet
	.addBlockHandler({ blockInterval: 200n, startBlockHeight, handler: hourDataHandler })
mainnet
	.contract("UNI3PoolAbi", UNI3PoolAbi)
	.addSources({ '0x4e0924d3a751be199c426d52fb1f2337fa96f736': startBlockHeight })
	.addEventHandlers({ 'Swap': onSwap })

export default manifest.build();