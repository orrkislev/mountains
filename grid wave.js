shadowModulo = round_random(10)
shadowDir = Math.sign(round_random(-3, 3))
shadowScale = .05
shadowAngle = 135 - shadowDir * (shadowModulo / 10) ** 2 * 90

drawSizeX = 4500
drawSizeY = 4500
pixelSizex = 1 / drawSizeX
pixelSizey = 1 / drawSizeY

cropCircle = true
withNormalLight = random() > .5

lerpVal = .1

palletes = [
    [255, 0], ['#f5f5e1', '#32321e'], ['orange', 'darkblue'], 'special'
]

async function setup() {
    initP5(true, false, 1)
    initPaper(false)
    noiseDetail(5, 0.5)
    p_d = pixelDensity()
    noFill()

    const pallete = choose(palletes)
    if (pallete == 'special') {
        colorMode(HSB, 360, 100, 100, 100)
        hue = random(3600) % 360
        lightClr = color(hue, 100, 80)
        shadowClr = color((hue + 225) % 360, 100, 40)
        // lightClr2 = color(hue, 80, 100)
        // shadowClr2 = color((hue + 225) % 360, 80, 20)
    } else {
        lightClr = color(pallete[0])
        shadowClr = color(pallete[1])
    }
    
    lightClr2 = color(255)
    shadowClr2 = color(0)
    bgColor = choose([0, 255])

    heightScale = height * 0.28
    y_scl = random(.3, 1)
    y_offset = random()

    lightShadowTechnique = choose(lightShadowTechniques)
    normalLightTechnique = choose(normalLightTechniques)

    p1 = p(-width / 2, 0).multiply(cropCircle ? 1.3 : 1)
    p2 = p(0, -(height / 3) * (y_scl - y_offset)).multiply(cropCircle ? 1.3 : 1)
    p3 = p(width / 2, 0).multiply(cropCircle ? 1.3 : 1)
    p4 = p(0, (height / 3) * (y_scl + y_offset)).multiply(cropCircle ? 1.3 : 1)

    // p1 = p(-width*.4, -height*.4)
    // p2 = p(width*.4, -height*.4)
    // p3 = p(width*.4, height*.4)
    // p4 = p(-width*.4, height*.4)
    m = new HeightObject(p1, p2, p3, p4)

    background(bgColor)

    translate(width / 2, height * .5 - m.center.y)
    await m.drawStuff()

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
        // return this.getTerrain(x, y) * heightScale
        const i = (Math.floor(x * mapX) + Math.floor(y * mapY) * mapX) * 4
        let h = this.heightMap.pixels[i] / 255
        h += this.heightMap.pixels[i + 1] / 255
        h += this.heightMap.pixels[i + 2] / 255
        h += this.heightMap.pixels[i + 3] / 255
        h = h * heightScale / 4
        return h
    }
    getHeightNormal(x, y) {
        const pos1 = V(x - pixelSizex, this.getHeight(x - pixelSizex, y), y)
        const pos2 = V(x + pixelSizex, this.getHeight(x + pixelSizex, y), y)
        const pos3 = V(x, this.getHeight(x, y - pixelSizey), y - pixelSizey)
        const pos4 = V(x, this.getHeight(x, y + pixelSizey), y + pixelSizey)
        const perp_x = pos2.sub(pos1).rotate(-90).normalize()
        const perp_y = pos4.sub(pos3).rotate(-90).normalize()
        return perp_x.add(perp_y).normalize()
    }

    getPos(pos, h) {
        if (h === undefined) h = this.getHeight(pos.x, pos.y)
        return this.getFlatPos(pos.x, pos.y).add(p(0, -h))
        // return this.getFlatPos(pos.x, pos.y).add(this.getNormal(pos.x, pos.y).multiply(h))
    }

    async drawStuff() {
        this.heightMap = this.heightMap || createHeightMap2()


        // const startAngle = 315
        // for (let a = 0; a < 180; a += 0.1) {
        //     ([1, -1]).forEach(s => {
        //         const uv = p(.5, 0).rotate(startAngle + s * a).add(p(0.5, 0.5))
        //         const h = this.getHeight(uv.x, uv.y)
        //         const p1 = this.getPos(uv, h)
        //         const p2 = this.getPos(p(.55, 0).rotate(startAngle + s * a).add(p(0.5, 0.5)), h)
        //         const p3 = p1.add(0, h)
        //         const p4 = p2.add(0, h)

        //         let v = (startAngle + s * a + 360) % 360
        //         v = 360 - v
        //         v -= 135
        //         v = (v + 360) % 360

        //         v = abs(v - shadowAngle) / 180
        //         stroke(255*v)
        //         for (let i = 0; i <= 1; i += 0.01) {
        //             let x = bezierPoint(p1.x, p2.x, p4.x, p3.x, i);
        //             let y = bezierPoint(p1.y, p2.y, p4.y, p3.y, i);
        //             // stroke(255-i * 255 * v)
        //             point(x, y);
        //         }
        //         // bezier(p1.x, p1.y, p2.x, p2.y, p4.x, p4.y, p3.x, p3.y)
        //     })
        // }


        let lastTimeout = performance.now()
        const dataSize = [drawSizeX, drawSizeY]
        let lastLights = Array(dataSize[0]).fill(0)
        let lastValues = Array(dataSize[0]).fill(1)
        const lastPositions = Array(dataSize[0]).fill(p(-1000, -1000))
        for (let y = 0; y < dataSize[1]; y++) {
            const nextLights = Array(dataSize[0]).fill(0)
            const nextValues = Array(dataSize[0]).fill(0)
            const offset = y % shadowModulo == 0 ? shadowDir : 0
            for (let x = 0; x < dataSize[0]; x++) {
                const h = this.getHeight(x / dataSize[0], y / dataSize[1])
                const pixelPos = this.getPos(p(x / dataSize[0], y / dataSize[1]), h)

                if (cropCircle && p(x / dataSize[0], y / dataSize[1]).getDistance(p(0.5, 0.5)) > 0.5) {
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
                    const n = this.getHeightNormal(x / dataSize[0], y / dataSize[1])
                    const d = p5.Vector.dot(n, createVector(-1, .2, .4).normalize())
                    clr = normalLightTechnique(clr, d)
                }

                stroke(clr)

                if (y == 0) drawPoint(pixelPos)
                else drawLine(lastPositions[x], pixelPos)
                lastPositions[x] = pixelPos


                if (cropCircle && abs(p(x / dataSize[0], y / dataSize[1]).getDistance(p(0.5, 0.5)) - .5) < 0.001) {
                    stroke(bgColor)
                    line(pixelPos.x, pixelPos.y, pixelPos.x, pixelPos.y + height)
                }

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

// smooth cmap, using quadratic bezier curve
const csmap = (v, a, b, c, d) => {
    let t = cmap(v, a, b, 0, 1)
    t = easeQuadInOut(t)
    return clerp(c, d, t)
}



lightShadowTechniques = [
    (v, h) => {
        if (v > 0) return lerpColor(lightClr, lightClr2, v)
        else return lerpColor(shadowClr, shadowClr2, -v)
    },
    (v, h) => lerpColor(shadowClr, lightClr, (v + 1) / 2),
    (v, h) => (v > 0) ? lightClr : shadowClr,
]

normalLightTechniques = [
    (clr, d) => d ** 12 > .3 ? lightClr2 : clr,
    (clr, d) => d ** 12 > .3 ? color(255) : color(0),
    (clr, d) => (abs((d * 10) % 1) < .5) ? lerpColor(clr, lightClr2, d * 2) : clr,
    (clr, d) => (abs((d * 10) % 1) < .5) ? lerpColor(clr, color(255), d * 2) : color(0)
]

