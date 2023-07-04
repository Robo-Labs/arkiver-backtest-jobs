import { Manifest } from "https://deno.land/x/robo_arkiver/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { FarmSnapshot } from "./entities/farmsnapshot.ts";

const startBlockHeight = 38350000n

const manifest = new Manifest('velodrome-snapshots-v2');
const optimism = manifest
	.addEntities([AmmPool, Token, Snapshot, FarmSnapshot])
	.chain("optimism")

// Hourly data handler
optimism
	.addBlockHandler({ blockInterval: 200, startBlockHeight, handler: hourDataHandler })

export default manifest.build();