import { Manifest } from "https://deno.land/x/robo_arkiver/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { CamelotAbi } from "./abis/camelotAbi.ts"
import { onSwap } from "./handlers/swaphandler.ts"
import { Ohlc } from "./entities/ohlc.ts";

const startBlockHeight = 103164316n 
//const startBlockHeight = 12440000n
const manifest = new Manifest('camelot-ohlc');
const mainnet = manifest
	.addEntities([AmmPool, Token, Snapshot, Ohlc])
	.chain("arbitrum", { blockRange: 500n })
	
	

// Hourly data handler
mainnet
	.addBlockHandler({ blockInterval: 2000n, startBlockHeight, handler: hourDataHandler })
mainnet
	.contract("CamelotAbi", CamelotAbi)
	.addSources({ '0xB1026b8e7276e7AC75410F1fcbbe21796e8f7526': startBlockHeight })
	.addEventHandlers({ 'Swap': onSwap })

export default manifest.build();