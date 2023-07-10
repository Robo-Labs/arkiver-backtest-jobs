import { fromHex, Hex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import {getBlock, getPool, getToken } from "./poolhelper.ts"
// import { velodromeV2Bribe } from '../abis/velodromeV2Bribe.ts'
import { velodromeV2Voter } from '../abis/velodromeV2Voter.ts'
import {VelodromeV2Bribe} from '../entities/VelodomeV2Bribe.ts'
import { velodromeV2Fee } from '../abis/velodromeV2Fee.ts'
import { toNumber } from './util.ts'
import { AmmPool } from '../entities/ammpool.ts'
import { VelodromeV2Vote } from '../entities/velodomeV2Vote.ts'
import { VelodromeV2Claim } from '../entities/velodromeV2Claim.ts'
//import { OhlcUtil } from './ohlcutil.ts'

// async function getPool(address: string){
//   return await AmmPool.findOne({address})
// }

    /// @dev Returns start of next epoch / end of current epoch
const WEEK = 7*(60*60*24);
function epochNext(timestamp: number): number {
    return timestamp - (timestamp % WEEK) + WEEK;
}

export const onClaim: EventHandlerFor<typeof velodromeV2Fee, "ClaimRewards"> = async (
  { event, client, store }
) => {
    console.log('claim')
    const {from, reward, amount} = event.args
    const block = await getBlock(client, store, event.blockNumber)
    const numberTimestamp = toNumber(block.timestamp)
    const claim = new VelodromeV2Claim({
        timestamp: numberTimestamp,
        address: event.address,
        from,
        reward,
        amount: numberToHex(amount)
    })
    await claim.save()
    //pool!.bribes.push(bribe)
}