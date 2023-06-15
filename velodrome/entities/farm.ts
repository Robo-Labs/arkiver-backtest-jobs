import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

export interface IFarmSnapshot {
	network: string,
	protocol: string,
	pool: any,
    gauge: string,
    block: number,
    timestamp: number,
    rewardTokens: any[],
    rewardTokenUSDPrices: [String],
    rewardTokenRate: [String]
}

export const FarmSnapshot = createEntity<IFarmSnapshot>("FarmSnapshot", {
	network: String,
	protocol: String,
	pool: [{ type: Types.ObjectId, ref: 'AmmPool'}],
    gauge: String,
    rewardTokens: [{ type: Types.ObjectId, ref: 'Token'}],
    rewardTokenUSDPrices: [String],
    rewardTokenRate: [String]
});

