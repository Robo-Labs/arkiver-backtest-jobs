import { createEntity } from "../deps.ts";

interface IHourData {
	pool: string,
	timestamp: number,
  block: number,
  price: number,
  activeBin: number,
  bins: {
    id: number,
    reserveX: number,
    reserveY: number,
    supply: string, // hex
  }[]
}

export const HourData = createEntity<IHourData>("HourData", {
	pool: String,
	timestamp: { type: Number, index: true },
  block: { type: Number, index: true },
  price: Number,
  activeBin: Number,
  bins: [{
    id: Number,
    reserveX: Number,
    reserveY: Number,
    supply: String, //hex
  }]
})