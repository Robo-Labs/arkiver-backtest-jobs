import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

export interface IFarmSnapshot {
	network: string,
	protocol: string,
	pool: any,
    poolAddress: string,
    gauge: string,
    block: number,
    timestamp: number,
    rewardTokens: any[],
    rewardTokenUSDPrices: [String],
    rewardPerToken: [String]
}

export const FarmSnapshot = createEntity<IFarmSnapshot>("FarmSnapshot", {
	network: String,
	protocol: String,
	pool: [{ type: Types.ObjectId, ref: 'AmmPool'}],
    poolAddress: String,
    block: { type: Number, index: true },
    timestamp: { type: Number, index: true },
    gauge: String,
    rewardTokens: [{ type: Types.ObjectId, ref: 'Token'}],
    rewardTokenUSDPrices: [String],
    rewardPerToken: [String]
});

