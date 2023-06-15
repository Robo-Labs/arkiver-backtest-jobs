import { Manifest } from "https://deno.land/x/robo_arkiver/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { FarmSnapshot } from "./entities/farm.ts";

const startBlockHeight = 105500000n // enough to test

const manifest = new Manifest('velodrome-snapshots');
const optimism = manifest
	.addEntities([AmmPool, Token, Snapshot, FarmSnapshot])
	.chain("optimism")

// Hourly data handler
optimism
	.addBlockHandler({ blockInterval: 200n, startBlockHeight, handler: hourDataHandler })

export default manifest.build();