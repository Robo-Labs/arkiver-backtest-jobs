import { Manifest } from "https://deno.land/x/robo_arkiver@v0.4.7/mod.ts";
import { CurvePool } from "./entities/curvepool.ts";
import { Token } from "./entities/token.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { Snapshot } from "./entities/snapshot.ts";
import { AavePool } from "./entities/aavepool.ts";

const startBlockHeight = 16308000n // enough to test

const manifest = new Manifest('curve-snapshots');
const ethereum = manifest
	.addEntities([CurvePool, AavePool, Token, Snapshot])
	.chain("mainnet", { blockRange: 799n })

// Hourly data handler
ethereum
	.addBlockHandler({ blockInterval: 10n, startBlockHeight, handler: hourDataHandler })

export default manifest.build();