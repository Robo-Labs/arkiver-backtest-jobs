import { Manifest } from "https://deno.land/x/robo_arkiver/mod.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { AAVEHourData } from "./entities/aavehourdata.ts";
import { Pool } from "./entities/pool.ts";
import { Token } from "./entities/token.ts";


// LUSD/WEH Pair Data
const VelodromeLusdWeth = '0x91e0fC1E4D32cC62C4f9Bc11aCa5f3a159483d31' as const
const startBlockHeight = 86540000n // aLUSD created on block 86532283

const manifest = new Manifest('aave-hourly-data-v1');
const optimism = manifest
	.addEntities([AAVEHourData, Pool, Token])
	.chain("optimism")

// Minute data handler
optimism
	.addBlockHandler({ blockInterval: 100n, startBlockHeight, handler: hourDataHandler })

export default manifest.build();