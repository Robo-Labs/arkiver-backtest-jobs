
export const toNumber = (n: bigint, decimals: number = 0) => {
	return Number(n) / (10 ** decimals)
}