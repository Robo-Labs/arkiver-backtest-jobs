import { BlockHandler, Store } from "../deps.ts";
import { type PublicClient, type Block } from "npm:viem";
import { Contract, Provider } from 'https://esm.sh/ethcall';
import { ethers, BigNumber } from "npm:ethers@6.1.0";
import erc20 from "../abis/erc20.ts";
import { GLP } from "../entities/glp.ts";
import { glpVaultAbi } from "../abis/glpVaultAbi.ts";
import { glpManagerAbi } from "../abis/glpManagerAbi.ts";
import { EACAggregatorProxyAbi } from "../abis/EACAggregatorProxyAbi.ts";
import { GmxRewardTrackerAbi } from "../abis/GMXRewardTracker.ts";
import { Univ2RouterAbi } from "../abis/Univ2RouterAbi.ts";

type Address = `0x${string}`
const GLP_PRICE_DECIMALS = 30
const STANDARD_DECIMALS = 18
const PRICE_FEED_DECIMALS = 8
const BTC_DECIMALS = 8
const ETH_DECIMALS = 18
const USDC_DECIMALS = 6
const FUNDING_RATE_DECIMALS = 6

const ETH: Address = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
const BTC: Address = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'
const GMX: Address = '0xfc5A1A6EB076a2C7aD06eD22C90d7E710E35ad0a'
const USDC: Address = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'

const toNumber = (n: bigint, decimals: number) => {
	return Number(n) / (10 ** decimals)
}

// deno-lint-ignore require-await
export const GLPHandler: BlockHandler = async ({ block, client }: {
	block: Block;
	client: PublicClient;
	store: Store;
}): Promise<void> => {
	const run = async () => {
		const ts = Date.now()
		console.log('block ' + block.number)
		if (block.number === null) throw new Error('')
		const blockNumber = block.number
		const isNewManager = blockNumber > 40559781n
		const provider = new ethers.JsonRpcProvider(client.transport.url)
		const multicall = new Provider(42161, provider);

		const mgr = isNewManager ? '0x3963FfC9dff443c2A94f21b129D429891E32ec18' as Address : '0x321F653eED006AD1C29D174e17d96351BDe22649' as Address // Use the new one after it was deployed
		const glpManager = new Contract(mgr, glpManagerAbi, provider)
		const glpErc20Token = new Contract('0x4277f8F2c384827B5273592FF7CeBd9f2C1ac258', erc20, provider)
		const glpVault = new Contract('0x489ee077994B6658eAfA855C308275EAd8097C4A', glpVaultAbi, provider)
		const btcChainlink = new Contract('0x6ce185860a4963106506C203335A2910413708e9', EACAggregatorProxyAbi, provider)
		const ethChainlink = new Contract('0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612', EACAggregatorProxyAbi, provider)
		const rewardTracker = new Contract('0x4e971a87900b931fF39d1Aad67697F49835400b6', GmxRewardTrackerAbi, provider)
		const SushiRouter = new Contract('0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', Univ2RouterAbi, provider)

		const [
			glpAumBn, 
			glpTotalSupplyBn, 
			btcUsdgAmountsBn,
			ethUsdgAmountsBn,
			btcPoolAmountBn,
			ethPoolAmountBn,
			btcReservedAmountBn,
			ethReservedAmountBn,
			btcPriceBn, 
			ethPriceBn,
			btcGlobalShortSizeBn, 
			ethGlobalShortSizeBn,
			btcGlobalShortAveragePricesBn, 
			ethGlobalShortAveragePricesBn,
			btcGuaranteedUsdBn, 
			ethGuaranteedUsdBn,
			btcUtilisationBn, 
			ethUtilisationBn,
			cumulativeRewardPerTokenBn,
			[, gmxPriceBn],
		] = await multicall.all([
			glpManager.getAum(true),
			glpErc20Token.totalSupply(),
			glpVault.usdgAmounts(BTC),
			glpVault.usdgAmounts(ETH),
			glpVault.poolAmounts(BTC),
			glpVault.poolAmounts(ETH),
			glpVault.reservedAmounts(BTC),
			glpVault.reservedAmounts(ETH),
			btcChainlink.latestAnswer(),
			ethChainlink.latestAnswer(),
			glpVault.globalShortSizes(BTC),
			glpVault.globalShortSizes(ETH),
			glpVault.globalShortAveragePrices(BTC),
			glpVault.globalShortAveragePrices(ETH),
			glpVault.guaranteedUsd(BTC),
			glpVault.guaranteedUsd(ETH),
			glpVault.getUtilisation(BTC),
			glpVault.getUtilisation(ETH),
			rewardTracker.cumulativeRewardPerToken(),
			SushiRouter.getAmountsOut(10n ** 18n,[GMX, USDC])
		], { blockTag: Number(blockNumber)} ) as any
		
		const glpAum = toNumber(glpAumBn, GLP_PRICE_DECIMALS)
		const glpTotalSupply = toNumber(glpTotalSupplyBn, STANDARD_DECIMALS)
		const btcUsdgAmounts = toNumber(btcUsdgAmountsBn, STANDARD_DECIMALS)
		const ethUsdgAmounts = toNumber(ethUsdgAmountsBn, STANDARD_DECIMALS)
		const btcPoolAmount = toNumber(btcPoolAmountBn, BTC_DECIMALS)
		const ethPoolAmount = toNumber(ethPoolAmountBn, ETH_DECIMALS)
		const btcAumA = btcPoolAmount
		const ethAumA = ethPoolAmount
		const btcReservedAmount = toNumber(btcReservedAmountBn, BTC_DECIMALS)
		const ethReservedAmount = toNumber(ethReservedAmountBn, ETH_DECIMALS)
		const btcPrice = toNumber(btcPriceBn, PRICE_FEED_DECIMALS)
		const ethPrice = toNumber(ethPriceBn, PRICE_FEED_DECIMALS)
		const btcShortSize = toNumber(btcGlobalShortSizeBn, GLP_PRICE_DECIMALS)
		const ethShortSize = toNumber(ethGlobalShortSizeBn, GLP_PRICE_DECIMALS)
		const btcShortAveragePrice = toNumber(btcGlobalShortAveragePricesBn, GLP_PRICE_DECIMALS)
		const ethShortAveragePrice = toNumber(ethGlobalShortAveragePricesBn, GLP_PRICE_DECIMALS)
		const btcGuaranteedUsd = toNumber(btcGuaranteedUsdBn, GLP_PRICE_DECIMALS)
		const ethGuaranteedUsd = toNumber(ethGuaranteedUsdBn, GLP_PRICE_DECIMALS)
		const btcUtilisation = toNumber(btcUtilisationBn, FUNDING_RATE_DECIMALS)
		const ethUtilisation = toNumber(ethUtilisationBn, FUNDING_RATE_DECIMALS)
		const cumulativeRewardPerToken = toNumber(cumulativeRewardPerTokenBn, GLP_PRICE_DECIMALS)
		const gmxPrice = toNumber(gmxPriceBn, USDC_DECIMALS)
		const glpPrice = glpAum / glpTotalSupply
		const btcReserves = btcAumA / btcPrice
		const ethReserves = ethAumA / ethPrice
		const btcAumB = btcGuaranteedUsd + (btcPoolAmount - btcReservedAmount) * btcPrice // Neutra getTokenAums
		const ethAumB = ethGuaranteedUsd + (ethPoolAmount - ethReservedAmount) * ethPrice // Neutra getTokenAums

		// Old calcs
		const oldGetTokenAum = async () => {
			const [
				btcAveragePriceBn,
				ethAveragePriceBn,
			] = await multicall.all([
				glpVault.globalShortAveragePrices(BTC),
				glpVault.globalShortAveragePrices(ETH),
			]) as any

			const btcAveragePrice = toNumber(btcAveragePriceBn, GLP_PRICE_DECIMALS)
			const ethAveragePrice = toNumber(ethAveragePriceBn, GLP_PRICE_DECIMALS)
			const btcPriceDelta = Math.abs(btcAveragePrice - btcPrice)
			const ethPriceDelta = Math.abs(ethAveragePrice - ethPrice)
			const btcDelta = btcShortSize * btcPriceDelta / btcAveragePrice
			const ethDelta = ethShortSize * ethPriceDelta / ethAveragePrice
			return { btcDelta, ethDelta }
		}

		// new calcs
		const newGetTokenAum = async () => {
			const [
				btcGlobalShortDeltaBn,
				ethGlobalShortDeltaBn,
			] = await multicall.all([
				glpManager.getGlobalShortDelta(BTC, btcPriceBn, btcGlobalShortSizeBn),
				glpManager.getGlobalShortDelta(ETH, ethPriceBn, ethGlobalShortSizeBn),
			]) as any

			const btcDelta = btcGlobalShortDeltaBn[1] ? toNumber(btcGlobalShortDeltaBn[0], GLP_PRICE_DECIMALS) : 0
			const ethDelta = ethGlobalShortDeltaBn[1] ? toNumber(ethGlobalShortDeltaBn[0], GLP_PRICE_DECIMALS) : 0
			return { btcDelta, ethDelta }
		}

		const { btcDelta, ethDelta } = await (isNewManager ? newGetTokenAum() : oldGetTokenAum())
	
		const btcAumC = btcAumB + btcDelta
		const ethAumC = ethAumB + ethDelta

		const glp = new GLP({
			id: `${blockNumber}`,
			block: Number(block.number),
			timestamp: Number(block.timestamp),
			glpAum,
			glpTotalSupply,
			glpPrice,
			btcReserves,
			ethReserves,
			btcReservedAmount,
			ethReservedAmount,
			btcPrice,
			ethPrice,
			btcUsdgAmounts,
			ethUsdgAmounts,
			ethAumA,
			btcAumA,
			ethAumB,
			btcAumB,
			ethAumC,
			btcAumC,
			ethShortSize,
			btcShortSize,
			btcShortAveragePrice,
			ethShortAveragePrice,
			btcUtilisation,
			ethUtilisation,
			cumulativeRewardPerToken,
			gmxPrice,
		})
		glp.save()
		console.log(((Date.now() - ts) / 1000).toFixed(2) + 's')
	}
	run()
};
