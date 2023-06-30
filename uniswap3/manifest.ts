import { Manifest } from "https://deno.land/x/robo_arkiver/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { Swap } from "./entities/swap.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { FarmSnapshot } from "./entities/farmsnapshot.ts";
import { UNI3PoolAbi } from "./abis/UNI3PoolAbi.ts"
import { UniV3NFTManagerAbi } from "./abis/UniV3NFTManagerAbi.ts"
import { onSwap } from "./handlers/swaphandler.ts"
import { onMint } from "./handlers/minthandler.ts"
import { onDecreaseLiquidity, onIncreaseLiquidity } from "./handlers/modliquidityhandler.ts"

const startBlockHeight = 12399631n // enough to test
const manifest = new Manifest('uniswapV3-3');
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
mainnet
	.contract("UNI3PoolAbi", UNI3PoolAbi)
	.addSources({ '0x4e0924d3a751be199c426d52fb1f2337fa96f736': startBlockHeight })
	.addEventHandlers({ 'Mint': onMint })
mainnet
.contract("UniV3NFTManagerAbi", UniV3NFTManagerAbi)
.addSources({ '0xC36442b4a4522E871399CD717aBDD847Ab11FE88': startBlockHeight })
.addEventHandlers({ 'IncreaseLiquidity': onIncreaseLiquidity })
mainnet
	.contract("UniV3NFTManagerAbi", UniV3NFTManagerAbi)
	.addSources({ '0xC36442b4a4522E871399CD717aBDD847Ab11FE88': startBlockHeight })
	.addEventHandlers({ 'DecreaseLiquidity': onDecreaseLiquidity })

export default manifest.build();