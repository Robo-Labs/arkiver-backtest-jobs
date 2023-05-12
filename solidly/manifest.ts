import { SolidlyPairAbi } from "./abis/solidlyPairAbi.ts";
import { burnHandler, mintHandler, syncHandler } from "./handlers/pairevents.ts";
import { Manifest } from "./deps.ts";
import { MinuteData } from "./entities/minutedata.ts";
import { minuteDataHandler } from "./handlers/minutedata.ts";
import { TotalSupply } from "./entities/totalsupply.ts";
import { Pair } from "./entities/pair.ts";
import { Token } from "./entities/token.ts";


// LUSD/WEH Pair Data
const VelodromeLusdWeth = '0x91e0fC1E4D32cC62C4f9Bc11aCa5f3a159483d31' as const
const startBlockHeight = 90000000n//97150000n

const manifest = new Manifest('velo-minute-data');
const optimsm = manifest
	.addEntities([MinuteData, TotalSupply, Pair, Token])
	.chain("optimism", { blockRange: 2000n })

// Pair handlers
optimsm
	.contract(SolidlyPairAbi)
	.addSource(VelodromeLusdWeth, startBlockHeight)
	.addEventHandler("Mint", mintHandler)
	.addEventHandler("Burn", burnHandler)
	.addEventHandler("Sync", syncHandler)

// Minute data handler
optimsm
	.addBlockHandler({ blockInterval: 10000, startBlockHeight, handler: minuteDataHandler })

export default manifest.build();