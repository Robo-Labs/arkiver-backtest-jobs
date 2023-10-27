
export const toNumber = (n: bigint, decimals = 0) => {
	return Number(n) / (10 ** decimals)
}

export const getNearestHour = (now: number) => {
	return Math.floor(now / HOUR) * HOUR
}

export const min = (a: bigint, b: bigint) => {
  return a < b ? a : b
}

export const max = (a: bigint, b: bigint) => {
  return a > b ? a : b
}