import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface IAAVEHourData {
	pool: any,
	timestamp: number,
	liquidityRate: number,
	variableBorrowRate: number,
	totalSupply: number,
	totalDebt: number,
}

export const AAVEHourData = createEntity<IAAVEHourData>("HourData", {
	pool: { type: Types.ObjectId, ref: 'Pool'},
	timestamp: { type: Number, index: true },
	liquidityRate: Number,
	variableBorrowRate: Number,
	totalSupply: Number,
	totalDebt: Number,
})