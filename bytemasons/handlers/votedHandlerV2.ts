import { fromHex, Hex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import {getBlock, getPool, getToken } from "./poolhelper.ts"
// import { velodromeV2Bribe } from '../abis/velodromeV2Bribe.ts'
import { velodromeV2Voter } from '../abis/velodromeV2Voter.ts'
import {VelodromeV2Bribe} from '../entities/VelodomeV2Bribe.ts'
import { toNumber } from './util.ts'
import { AmmPool } from '../entities/ammpool.ts'
import { VelodromeV2Vote } from '../entities/velodomeV2Vote.ts'
//import { OhlcUtil } from './ohlcutil.ts'

// async function getPool(address: string){
//   return await AmmPool.findOne({address})
// }

    /// @dev Returns start of next epoch / end of current epoch
const WEEK = 7*(60*60*24);
function epochNext(timestamp: number): number {
    return timestamp - (timestamp % WEEK) + WEEK;
}
const INTERESTEDPOOLS=["0xF31cbe21Bbbb8056b75d6ca21e8fFd2CD38bD5C5"]

export const onVoted: EventHandlerFor<typeof velodromeV2Voter, "Voted"> = async (
  { event, client, store }
) => {
    const {timestamp, totalWeight, weight, voter, pool, tokenId} = event.args
    if(!INTERESTEDPOOLS.includes(pool)) return
    const block = await getBlock(client, store, event.blockNumber)
    const numberTimestamp = toNumber(block.timestamp)
    // const timeUntilNext = epochNext(numberTimestamp) - numberTimestamp
    const poolObj = await getPool(client, pool, pool)  //TODO ask smooth if we should just use pool address to speed dis up
    console.log(`voted: event.address: ${event.address}`)
    console.log(`voted: pool: ${pool}`)
    const vote = new VelodromeV2Vote({
        pool: poolObj,
        timestamp: toNumber(timestamp),
        start: epochNext(toNumber(block.timestamp)),
        end: epochNext(toNumber(block.timestamp)) + WEEK,
        voter,
        tokenId: toNumber(tokenId),
        weight: numberToHex(weight),
        totalWeight: numberToHex(totalWeight)
    })
    await vote.save()
    //pool!.bribes.push(bribe)
}