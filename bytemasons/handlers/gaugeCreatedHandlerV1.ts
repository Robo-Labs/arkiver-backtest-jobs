import { fromHex, Hex, numberToHex } from 'npm:viem'
import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.14/mod.ts'
import {getBlock, getPool, getToken } from "./poolhelper.ts"
import { velodromeV1Voter } from '../abis/velodromeV1Voter.ts'
// import { getGaugeStats } from '../../curve/handlers/poolhelper.ts'
// import { toNumber } from '../../../../.cache/deno/npm/registry.npmjs.org/ethers/6.6.2/lib.esm/utils/maths.d.ts'
import { AmmPool } from '../../uniswap3/entities/ammpool.ts'
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
export const onGaugeCreated: EventHandlerFor<typeof velodromeV1Voter, "GaugeCreated"> = async (
  { event, client, store }
) => {
    const {_gauge, sender, internal_bribe, external_bribe, poolAddress} = event.args
    if(!INTERESTEDPOOLS.includes(poolAddress)) return
    //emit GaugeCreated(_gauge, msg.sender, _internal_bribe, _external_bribe, _pool);
    const pool = await getPool(client, poolAddress, poolAddress)
    pool.bribeAddress = external_bribe
    await pool.save()
}