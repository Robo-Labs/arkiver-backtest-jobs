import { Manifest } from "./deps.ts";
import { GLP } from "./entities/glp.ts";
import { GLPHandler } from "./handlers/glp.ts";

const manifest = new Manifest();

manifest
	.addEntity(GLP)
	.addChain("arbitrum" as any)
	.addBlockHandler({ blockInterval: 100, startBlockHeight: BigInt(30000000), handler: GLPHandler })// 


export default manifest.build();