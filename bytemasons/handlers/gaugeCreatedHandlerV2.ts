import { fromHex, Hex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import {getBlock, getPool, getToken } from "./poolhelper.ts"
import { velodromeV2Voter } from '../abis/velodromeV2Voter.ts'
// import { getGaugeStats } from '../../curve/handlers/poolhelper.ts'
// import { toNumber } from '../../../../.cache/deno/npm/registry.npmjs.org/ethers/6.6.2/lib.esm/utils/maths.d.ts'
//import { AmmPool } from '../../uniswap3/entities/ammpool.ts'
//import { OhlcUtil } from './ohlcutil.ts'

async function mapBribeToPool(address: string){
  return await AmmPool.findOne({bribeAddress: address})
}

    /// @dev Returns start of next epoch / end of current epoch
const WEEK = 7*(60*60*24);
function epochNext(timestamp: number): number {
    return timestamp - (timestamp % WEEK) + WEEK;
}

const INTERESTEDPOOLS=["0xF31cbe21Bbbb8056b75d6ca21e8fFd2CD38bD5C5"]
export const onGaugeCreated: EventHandlerFor<typeof velodromeV2Voter, "GaugeCreated"> = async (
  { event, client, store }
) => {
    console.log('GaugeCreatedV2')
    const {poolFactory,votingRewardsFactory,gaugeFactory,pool,bribeVotingReward, feeVotingReward, gauge, sender  } = event.args
    if(!INTERESTEDPOOLS.includes(pool)) return
    //emit GaugeCreated(_gauge, msg.sender, _internal_bribe, _external_bribe, _pool);
    console.log('event args')
    console.log(event.args)
    const AmmPool = await getPool(client, pool, pool)
    AmmPool.bribeAddress = String(bribeVotingReward).toLowerCase()
    AmmPool.feeVotingReward = String(feeVotingReward).toLowerCase()
    await AmmPool.save()
}