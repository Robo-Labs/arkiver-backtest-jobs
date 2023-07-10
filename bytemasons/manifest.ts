import { Manifest } from "https://deno.land/x/robo_arkiver/mod.ts";
import { VelodromeV2Bribe } from './entities/VelodomeV2Bribe.ts'
import { AmmPool } from './entities/ammpool.ts'
import { Token } from './entities/token.ts'
import { PoolSnapshot } from './entities/snapshot.ts'
import { VelodromeV2Vote } from './entities/velodomeV2Vote.ts'
import { hourDataHandler } from './handlers/hourdata.ts'
import { velodromeV2Voter } from './abis/velodromeV2Voter.ts'
import { velodromeV2Bribe } from './abis/velodromeV2Bribe.ts'
import { onGaugeCreated } from './handlers/gaugeCreatedHandlerV2.ts'
import { onNotifyReward } from './handlers/notifyRewardHandlerV2.ts'
import { onVoted } from './handlers/votedHandlerV2.ts'
import { velodromeV2Fee } from './abis/velodromeV2Fee.ts'
import { onClaim } from './handlers/claimHandlerV2.ts'
import { VelodromeV2Claim } from './entities/velodromeV2Claim.ts'

const manifest = new Manifest('byteMasons')
const startBlockHeight = 105896851n
const chain = manifest
  .addEntities([VelodromeV2Bribe, AmmPool, Token, PoolSnapshot, VelodromeV2Vote, VelodromeV2Claim])
  .chain('optimism')
  
chain.contract('voter', velodromeV2Voter)
  .addSources({ '0x41C914ee0c7E1A5edCD0295623e6dC557B5aBf3C': startBlockHeight })
  .addEventHandlers({ 'GaugeCreated': onGaugeCreated, 'Voted': onVoted })
chain.contract('bribe', velodromeV2Bribe)
  .addSources({ '0xCAaDDD88341F9E9B24eb02De275b45377eE43A8A': startBlockHeight })
  .addEventHandlers({ 'NotifyReward': onNotifyReward })
  chain.contract('fees', velodromeV2Fee)
  .addSources({ '0x94b7bc0f6814438ea29c020aed26eb2d7003a8a8': startBlockHeight })
  .addEventHandlers({ 'ClaimRewards': onClaim })
// chain.contract('bribe', velodromeV2Bribe)
//   .addSources({})
chain
  .addBlockHandler({
    blockInterval: 1000,
    startBlockHeight: startBlockHeight,
    handler: hourDataHandler,
  })

export default manifest
  .build()
