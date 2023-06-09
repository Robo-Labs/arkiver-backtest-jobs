import { createEntity } from "../deps.ts";

interface IGLP {
	id: string
	block: number
	timestamp: number
	glpAum: number
	glpTotalSupply: number
	glpPrice: number
	btcReserves: number
	ethReserves: number
	btcReservedAmount: number
	ethReservedAmount: number
	btcPrice: number
	ethPrice: number
	ethUsdgAmounts: number
	btcUsdgAmounts: number
	ethAumA: number
	btcAumA: number
	ethAumB: number
	btcAumB: number
	ethAumC: number
	btcAumC: number
	ethShortSize: number
	btcShortSize: number
	btcShortAveragePrice: number
	ethShortAveragePrice: number
	btcUtilisation: number
	ethUtilisation: number
	cumulativeRewardPerToken: number
	gmxPrice: number
}

export const GLP = createEntity<IGLP>("GLP", {
  id: String,
  block: { type: Number, index: true },
  timestamp: { type: Number, index: true },
  glpAum: Number,
  glpTotalSupply: Number,
  glpPrice: Number,
  btcReserves: Number,
  ethReserves: Number,
  btcReservedAmount: Number,
  ethReservedAmount: Number,
  btcPrice: Number,
  ethPrice: Number,
  ethAumA: Number,
  btcAumA: Number,
  ethAumB: Number,
  btcAumB: Number,
  ethAumC: Number,
  btcAumC: Number,
  ethShortSize: Number,
  btcShortSize: Number,
  btcShortAveragePrice: Number,
  ethShortAveragePrice: Number,
  btcUtilisation: Number,
  ethUtilisation: Number,
  cumulativeRewardPerToken: Number,
  gmxPrice: Number,
});
