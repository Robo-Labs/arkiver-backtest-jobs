import { Manifest } from "https://deno.land/x/robo_arkiver/mod.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Pool } from "./entities/pool.ts";
import { Token } from "./entities/token.ts";
import { Snapshot } from "./entities/snapshot.ts";


// LUSD/WEH Pair Data
const startBlockHeight = 71946768n // aLUSD created on block 86532283

const manifest = new Manifest('sonne-snapshots');
const optimism = manifest
	.addEntities([Snapshot, Pool, Token])
	.chain("optimism")

// Minute data handler
optimism
	.addBlockHandler({ blockInterval: 100, startBlockHeight, handler: hourDataHandler })

export default manifest.build();