import { fromHex, Hex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import {getBlock, getPool, getToken } from "./poolhelper.ts"
import { velodromeV2Bribe } from '../abis/velodromeV2Bribe.ts'
import {VelodromeV2Bribe} from '../entities/VelodomeV2Bribe.ts'
import { toNumber } from './util.ts'
import { AmmPool } from '../entities/ammpool.ts'
//import { OhlcUtil } from './ohlcutil.ts'

async function mapBribeToPool(address: string){
  return await AmmPool.findOne({'bribeAddress': address})
}

    /// @dev Returns start of next epoch / end of current epoch
const WEEK = 7*(60*60*24);
function epochNext(timestamp: number): number {
    return timestamp - (timestamp % WEEK) + WEEK;
}

const INTERESTEDPOOLS=["0xF31cbe21Bbbb8056b75d6ca21e8fFd2CD38bD5C5"]

export const onNotifyReward: EventHandlerFor<typeof velodromeV2Bribe, "NotifyReward"> = async (
  { event, client, store }
) => {
    const pool = await mapBribeToPool(event.address)
    if(!INTERESTEDPOOLS.includes(pool.address)) return

    const {from, reward, epoch, amount} = event.args
    const block = await getBlock(client, store, event.blockNumber)
    const rewardToken = await getToken(client, client.chain!.name, reward )
    const numberTimestamp = toNumber(block.timestamp)
    const timeUntilNext = epochNext(numberTimestamp) - numberTimestamp
    

    console.log(`event.address: ${event.address}`)
    console.log(`pool: ${pool}`)
    const bribe = new VelodromeV2Bribe({
        pool,
        poolAddress: pool.address,
        timestamp: toNumber(block.timestamp),
        start: epochNext(toNumber(block.timestamp)),
        end: epochNext(toNumber(block.timestamp)) + WEEK,
        sender: from,
        epoch: toNumber(epoch),
        reward: rewardToken,
        rewardAddress: rewardToken.address,
        amount: toNumber(amount, rewardToken.decimals),
    })
    await bribe.save()
    //pool!.bribes.push(bribe)
}