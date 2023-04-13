import { createEntity } from "../deps.ts";

interface IMinuteData {
	id: string
	timestamp: number,
	totalSupply: number,
	reserves0: number,
	reserves1: number,
}

export const MinuteData = createEntity<IMinuteData>("MinuteData", {
	id: String,
	timestamp: { type: Number, index: true },
	totalSupply: Number,
	reserves0: Number,
	reserves1: Number,
});
