// const supplyRatePerBlock = 950347850
const blocksPerYear = 365 * 24 * 60 * 60 / 1
// const rate = supplyRatePerBlock * blocksPerYear
// console.log(rate / 1e18)
// console.log(((1e18 + supplyRatePerBlock) / 1e18) ** blocksPerYear)


const sonnePerBlock = 91357741013071900 / 1e18
const totalSupply = Math.floor(89417273776870085 * 204695333509436 / 1e18) / 1e6
const sonnePrice = 0.132

console.log(sonnePerBlock)
console.log(totalSupply)
console.log(sonnePerBlock * blocksPerYear * sonnePrice / totalSupply)