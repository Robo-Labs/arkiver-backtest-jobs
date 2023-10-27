import { type EventHandlerFor } from 'https://deno.land/x/robo_arkiver@v0.4.22/mod.ts'
import { CamelotAbi } from '../abis/camelotAbi.ts'

export const onFee: EventHandlerFor<typeof CamelotAbi, "Fee"> = async (
  { event, client, store }
) => {
  // console.log('fee handler')
  // console.log(event.args, event.blockNumber)
  await store.set(`fee:${event.address}`, (event.args))
}