shadowModulo = round_random(10)
shadowDir = Math.sign(round_random(-3, 3))

shadowAngle = 135 - shadowDir * (shadowModulo / 10) ** 2 * 90

cropCircle = true
withNormalLight = random() > .5

lerpVal = .1

palletes = [
    [255, 0], [255, 0],
    ['#f5f5e1', '#32321e'], ['orange', 'darkblue'], 'special'
]

async function setup() {
    createCanvas(windowWidth,windowWidth)
    angleMode(DEGREES)
    p_d = pixelDensity()
    noFill()

    drawSize = width * 4
    pixelSize = 1 / drawSize
    shadowScale = map(drawSize, 3500, 1750, 0.05, 0.1)

    const pallete = choose(palletes)
    if (pallete == 'special') {
        colorMode(HSB, 360, 100, 100, 100)
        hue = random(3600) % 360
        lightClr = color(hue, 100, 80)
        shadowClr = color((hue + 225) % 360, 100, 40)
        // lightClr2 = color(hue, 80, 100)
        // shadowClr2 = color((hue + 225) % 360, 80, 20)
        lightShadowTechniques.pop()
    } else {
        lightClr = color(pallete[0])
        shadowClr = color(pallete[1])
    }

    lightClr2 = color(255)
    shadowClr2 = color(0)
    bgColor = choose([0, 255])

    heightScale = height * 0.28
    y_scl = random(.3, 1)
    y_offset = random(-.3, 1)

    lightShadowTechnique = choose(lightShadowTechniques)
    normalLightTechnique = choose(normalLightTechniques)

    const p1 = p(-width / 2, 0).multiply(cropCircle ? 1.3 : 1)
    const p2 = p(0, -(height / 3) * (y_scl - y_offset)).multiply(cropCircle ? 1.3 : 1)
    const p3 = p(width / 2, 0).multiply(cropCircle ? 1.3 : 1)
    const p4 = p(0, (height / 3) * (y_scl + y_offset)).multiply(cropCircle ? 1.3 : 1)
    await new HeightObject(p1, p2, p3, p4).drawStuff()

    // saveCanvas(fxhash, "png")
    // setTimeout(() => {
    //     window.location.reload()
    // }, 200)
}





class HeightObject {
    constructor(p1, p2, p3, p4) {
        this.p1 = p1; this.p2 = p2; this.p3 = p3; this.p4 = p4
    }
    get center() {
        return this.p1.add(this.p2).add(this.p3).add(this.p4).divide(4)
    }
    getNormal(x, y) {
        const x_1 = this.getFlatPos(x - 0.01, y)
        const x1 = this.getFlatPos(x + 0.01, y)
        const y_1 = this.getFlatPos(x, y - 0.01)
        const y1 = this.getFlatPos(x, y + 0.01)
        const perp_x = x1.subtract(x_1).rotate(-90).normalize()
        const perp_y = y1.subtract(y_1).rotate(-90).normalize()
        return perp_x.add(perp_y).normalize()
    }
    getFlatPos(x, y) {
        const p5 = this.p1.add(this.p2.subtract(this.p1).multiply(x))
        const p6 = this.p4.add(this.p3.subtract(this.p4).multiply(x))
        return p5.add(p6.subtract(p5).multiply(y))
    }
    getHeight(x, y) {
        const i = (Math.floor(x * mapX) + Math.floor(y * mapY) * mapX) * 4
        let h = this.heightMap.pixels[i] / 255
        h += this.heightMap.pixels[i + 1] / 255
        h += this.heightMap.pixels[i + 2] / 255
        h += this.heightMap.pixels[i + 3] / 255
        h = h * heightScale / 4
        return h
    }
    getHeightNormal(x, y) {
        const pos1 = p(x - pixelSize, this.getHeight(x - pixelSize, y), y)
        const pos2 = p(x + pixelSize, this.getHeight(x + pixelSize, y), y)
        const pos3 = p(x, this.getHeight(x, y - pixelSize), y - pixelSize)
        const pos4 = p(x, this.getHeight(x, y + pixelSize), y + pixelSize)
        const perp_x = pos2.subtract(pos1).rotate(-90).normalize()
        const perp_y = pos4.subtract(pos3).rotate(-90).normalize()
        return perp_x.add(perp_y).normalize()
    }

    getPos(pos, h) {
        if (h === undefined) h = this.getHeight(pos.x, pos.y)
        if (abs(y_offset) < .2) return this.getFlatPos(pos.x, pos.y).add(p(0, -h))
        return this.getFlatPos(pos.x, pos.y).add(this.getNormal(pos.x, pos.y).multiply(h))
    }

    async drawStuff() {
        this.heightMap = this.heightMap || createHeightMap2()

        translate(width / 2, height / 2)
        let minY = height
        let maxY = -height
        for (let y = 0; y < 1000; y++) {
            for (let x = 0; x < 1000; x++) {
                if (cropCircle && p(x / 1000, y / 1000).getDistance(p(0.5, 0.5)) < 0.5) {
                    const pos = this.getPos(p(x / 1000, y / 1000))
                    minY = min(minY, pos.y)
                    maxY = max(maxY, pos.y)
                    drawPoint(pos)
                }
            }
        }
        resizeCanvas(width, maxY - minY + width / 20)
        resetMatrix()
        background(bgColor)
        translate(width / 2, -minY + width / 40)


        let lastTimeout = performance.now()
        let lastLights = Array(drawSize).fill(0)
        let lastValues = Array(drawSize).fill(1)
        const lastPositions = Array(drawSize).fill(p(-1000, -1000))

        for (let y = 0; y < drawSize; y++) {
            const nextLights = Array(drawSize).fill(0)
            const nextValues = Array(drawSize).fill(0)
            const offset = y % shadowModulo == 0 ? shadowDir : 0
            for (let x = 0; x < drawSize; x++) {
                const h = this.getHeight(x / drawSize, y / drawSize)
                const pixelPos = this.getPos(p(x / drawSize, y / drawSize), h)

                if (cropCircle && p(x / drawSize, y / drawSize).getDistance(p(0.5, 0.5)) > 0.5) {
                    lastPositions[x] = pixelPos
                    continue
                }

                const lastValue = (x + offset < lastValues.length && x + offset >= 0) ? lastValues[x + offset] : 0
                const lastLight = lastLights[x + offset] || 0

                let nextValue = lastValue
                if (h >= lastLight) {
                    if (nextValue < 0) nextValue = 0
                    nextValue = lerp(nextValue, .9, lerpVal)
                    nextLights[x] = h
                } else {
                    if (nextValue > 0) nextValue = 0
                    nextValue = lerp(nextValue, -.9, lerpVal)
                    nextLights[x] = lastLight - shadowScale
                }

                let clr = lightShadowTechnique(nextValue, h)
                nextValues[x] = nextValue

                if (withNormalLight) {
                    const n = this.getHeightNormal(x / drawSize, y / drawSize)
                    const d = n.dot(p(-1,.2).normalize())
                    clr = normalLightTechnique(clr, d)
                }

                stroke(clr)

                if (y == 0) drawPoint(pixelPos)
                else drawLine(lastPositions[x], pixelPos)
                lastPositions[x] = pixelPos


                stroke(bgColor)
                line(pixelPos.x, pixelPos.y + 1, pixelPos.x, pixelPos.y + height)

            }

            if (performance.now() - lastTimeout > 1000 / 30) {
                await timeout()
                lastTimeout = performance.now()
            }

            lastLights = nextLights
            lastValues = nextValues
        }

    }
}

const drawLine = (p1, p2) => line(p1.x, p1.y, p2.x, p2.y)
const drawPoint = (pos) => line(pos.x, pos.y, pos.x, pos.y)
const lerpPoint = (p1, p2, t) => p(lerp(p1.x, p2.x, t), lerp(p1.y, p2.y, t))
const clerp = (a, b, t) => {
    if (t < 0) return a
    if (t > 1) return b
    return lerp(a, b, t)
}
const cmap = (v, a, b, c, d) => clerp(c, d, map(v, a, b, 0, 1))
const easeQuadInOut = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
const csmap = (v, a, b, c, d) => {
    let t = cmap(v, a, b, 0, 1)
    t = easeQuadInOut(t)
    return clerp(c, d, t)
}



const lightShadowTechniques = [
    (v, h) => (v > 0) ? lightClr : shadowClr,
    (v, h) => {
        if (v > 0) return lerpColor(lightClr, lightClr2, v)
        else return lerpColor(shadowClr, shadowClr2, -v)
    },
    (v, h) => lerpColor(shadowClr, lightClr, (v + 1) / 2),
]

const normalLightTechniques = [
    (clr, d) => d ** 12 > .3 ? lightClr2 : clr,
    (clr, d) => d ** 12 > .3 ? color(255) : color(0),
    (clr, d) => (abs((d * 10) % 1) < .5) ? lerpColor(clr, lightClr2, d * 2) : clr,
    (clr, d) => (abs((d * 10) % 1) < .5) ? lerpColor(clr, color(255), d * 2) : color(0)
]


p = (x, y) => new P(x,y)
class P{
    constructor(x,y){
        this.x = x
        this.y = y
    }
    add(p){ return new P(this.x + p.x, this.y + p.y) }
    subtract(p){ return new P(this.x - p.x, this.y - p.y) }
    multiply(s){ return new P(this.x * s, this.y * s) }
    divide(s){ return new P(this.x / s, this.y / s) }
    rotate(a){ return new P(this.x * cos(a) - this.y * sin(a), this.x * sin(a) + this.y * cos(a)) }
    normalize(){ return this.divide(this.length) }
    get length(){ return sqrt(this.x ** 2 + this.y ** 2) }
    getDistance(p){ return dist(this.x, this.y, p.x, p.y) }
    dot(p){ return this.x * p.x + this.y * p.y }
}