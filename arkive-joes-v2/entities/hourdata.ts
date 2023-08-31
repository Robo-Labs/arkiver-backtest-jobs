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
    supply: number,
  }[]
}

export const HourData = createEntity<IHourData>("HourData", {
	pool: String,
	timestamp: Number,
  block: Number,
  price: Number,
  activeBin: Number,
  bins: [{
    id: Number,
    reserveX: Number,
    reserveY: Number,
    supply: Number,
  }]
})