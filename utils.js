const timeout = ms => new Promise(resolve => setTimeout(resolve, ms));

const random = (a = 1, b = 0) => fxrand() * (b - a) + a
const randomRange = (range) => random(range[0], range[1])
const round_random = (a = 1, b = 0) => Math.floor(random(a, b + 1))
const choose = (arr) => arr[Math.floor(random(arr.length))]
const repeat = (n, func) => { for(let i = 0; i < n; i++) func(i) }