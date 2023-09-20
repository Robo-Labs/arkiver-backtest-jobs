import { Manifest } from "https://deno.land/x/robo_arkiver@v0.4.22/mod.ts";
import { hourDataHandler } from "./handlers/hourdata.ts";
import { AAVEHourData } from "./entities/aavehourdata.ts";
import { Pool } from "./entities/pool.ts";
import { Token } from "./entities/token.ts";

const manifest = new Manifest('aave-multichain')
  .addEntities([AAVEHourData, Pool, Token])
  .addChain('optimism', (chain) => 
    chain.addBlockHandler({ blockInterval: 100, startBlockHeight: 86540000n, handler: hourDataHandler })
  )
  .addChain('arbitrum', (chain) => 
    chain.addBlockHandler({ blockInterval: 100, startBlockHeight: 50000000n, handler: hourDataHandler })
  )
  // TODO - Add more chains

export default manifest.build();