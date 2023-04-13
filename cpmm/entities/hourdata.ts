import { createEntity } from "../deps.ts";

interface IHourData {
	id: string
	timestamp: number,
	usdcIncomeRate: number,
	ethDebtRate: number,
	rewardsPerSecond: number,
	rewardTokenPrice: number,
}

export const HourData = createEntity<IHourData>("HourData", {
	id: String,
	timestamp: { type: Number, index: true },
	usdcIncomeRate: Number,
	ethDebtRate: Number,
	rewardsPerSecond: Number,
	rewardTokenPrice: Number,
});
