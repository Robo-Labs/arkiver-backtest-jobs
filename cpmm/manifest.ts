import { LPAbi } from "./abis/lpabi.ts";
import { Swap } from "./entities/swap.ts";
import { burnHandler, mintHandler, syncHandler } from "./handlers/handlers.ts";
import { Manifest } from "./deps.ts";
import { Sync } from "./entities/sync.ts";
import { MinuteData } from "./entities/minutedata.ts";
import { TotalSupply } from "./entities/totalsupply.ts";
import { HourData } from "./entities/hourdata.ts";

const manifest = new Manifest('cpmm_v1');



const arbitrum = manifest
	.addEntities([Swap, Sync, MinuteData, TotalSupply, HourData])
	.addChain("arbitrum", { blockRange: 500n })


// ETH/USD Pair Data
const PAIR = '0x84652bb2539513BAf36e225c930Fdd8eaa63CE27' as const
arbitrum
	.contract(LPAbi)
	.addSource(PAIR, 70000000n)
	.addEventHandler("Mint", mintHandler)
	.addEventHandler("Burn", burnHandler)
	.addEventHandler("Sync", syncHandler)


export default manifest.build();