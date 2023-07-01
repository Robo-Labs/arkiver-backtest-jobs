import { Manifest } from "https://deno.land/x/robo_arkiver/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { Swap } from "./entities/swap.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { FarmSnapshot } from "./entities/farmsnapshot.ts";
import { UNI3PoolAbi } from "./abis/UNI3PoolAbi.ts"
import { onSwap } from "./handlers/swaphandler.ts"
import { Ohlc } from "./entities/ohlc.ts";

const startBlockHeight = 14353601n 
//const startBlockHeight = 12440000n
const manifest = new Manifest('uniswapV3-lucky5');
const mainnet = manifest
	.addEntities([AmmPool, Token, Snapshot, FarmSnapshot, Swap, Ohlc])
	.chain("mainnet", { blockRange: 500n })
	
	

// Hourly data handler
mainnet
	.addBlockHandler({ blockInterval: 200n, startBlockHeight, handler: hourDataHandler })
mainnet
	.contract("UNI3PoolAbi", UNI3PoolAbi)
	.addSources({ '0x4e0924d3a751be199c426d52fb1f2337fa96f736': startBlockHeight })
	.addEventHandlers({ 'Swap': onSwap })

export default manifest.build();