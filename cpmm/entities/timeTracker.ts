import { createEntity } from "../deps.ts";

interface ITimeTracker {
	id: string
	lastTimestamp: number
}

export const TimeTracker = createEntity<ITimeTracker>("TimeTracker", {
  id: String,
  lastTimestamp: { type: Number, index: true },
});
