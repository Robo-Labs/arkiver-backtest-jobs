
export const toNumber = (n: bigint, decimals = 0) => {
	return Number(n) / (10 ** decimals)
}

export const getNearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}