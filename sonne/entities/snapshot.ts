import { createEntity } from "../deps.ts";
import { Types } from 'npm:mongoose'

interface ISnapshot {
	pool: any,
	timestamp: number,
	block: number,
	liquidityRate: number,
	variableBorrowRate: number,
	totalSupply: number,
	totalDebt: number,
	cTokenTotalSupply: number,
	compPrice: number,
	compSupplyPerBlock: number,
	compBorrowPerBlock: number,
}

export const Snapshot = createEntity<ISnapshot>("Snapshot", {
	pool: { type: Types.ObjectId, ref: 'Pool'},
	timestamp: { type: Number, index: true },
	block: { type: Number, index: true },
	liquidityRate: Number,
	variableBorrowRate: Number,
	totalSupply: Number,
	totalDebt: Number,
	cTokenTotalSupply: Number,
	compPrice: Number,
	compSupplyPerBlock: Number,
	compBorrowPerBlock: Number,
})