import { Manifest } from "./deps.ts";
import { GLP } from "./entities/glp.ts";
import { GLPHandler } from "./handlers/glp.ts";

const manifest = new Manifest('nglpbacktest_v3');

manifest
	.addEntity(GLP)
	.addChain("arbitrum" as any)
	.addBlockHandler({ blockInterval: 1000, startBlockHeight: BigInt(900000), handler: GLPHandler })


export default manifest.build();