import { Manifest } from "https://deno.land/x/robo_arkiver@v0.4.7/mod.ts";
import { AmmPool } from "./entities/ammpool.ts";
import { Token } from "./entities/token.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { AavePool } from "./entities/aavepool.ts";

const startBlockHeight = 80000000n // enough to test

const manifest = new Manifest('velodrome-snapshots');
const optimism = manifest
	.addEntities([AmmPool, Token, Snapshot])
	.chain("optimism")

// Hourly data handler
optimism
	.addBlockHandler({ blockInterval: 200n, startBlockHeight, handler: hourDataHandler })

export default manifest.build();