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
    print('vanilla')
    noiseSeed(round_random(1000))

    canvas = document.createElement('canvas')
    canvas.width = window.innerWidth * 2
    canvas.height = window.innerHeight * 2
    width = canvas.width
    height = canvas.height
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'
    document.body.appendChild(canvas)
    ctx = canvas.getContext('2d')

    mainElement = document.querySelector('main')
    mainElement.style.display = 'none'

    drawSize = width * 2
    pixelSize = 1 / drawSize
    shadowScale = map(drawSize, 3500, 1750, 0.05, 0.1) * 4
    shadowScale = 0.08


    const pallete = choose(palletes)
    if (pallete == 'special') {
        // colorMode(HSB, 360, 100, 100, 100)
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

    lightClr = new Color(255, 255, 255)
    shadowClr = new Color(0, 0, 0)
    lightClr2 = new Color(255, 255, 255)
    shadowClr2 = new Color(0, 0, 0)
    
    // lightClr2 = color(255)
    // shadowClr2 = color(0)
    bgColor = choose([0, 255])

    bgColor = new Color(120, 120, 120)


    heightScale = height * 0.28
    y_scl = random(.3, 1)
    y_offset = random(-.3, 1)

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

    console.time('drawStuff')
    await m.drawStuff()
    console.timeEnd('drawStuff')

    print('done')

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
        const pos1 = V(x - pixelSize, this.getHeight(x - pixelSize, y), y)
        const pos2 = V(x + pixelSize, this.getHeight(x + pixelSize, y), y)
        const pos3 = V(x, this.getHeight(x, y - pixelSize), y - pixelSize)
        const pos4 = V(x, this.getHeight(x, y + pixelSize), y + pixelSize)
        const perp_x = pos2.sub(pos1).rotate(-90).normalize()
        const perp_y = pos4.sub(pos3).rotate(-90).normalize()
        return perp_x.add(perp_y).normalize()
    }

    getPos(pos, h) {
        if (h === undefined) h = this.getHeight(pos.x, pos.y)
        if (abs(y_offset) < .2) return this.getFlatPos(pos.x, pos.y).add(p(0, -h))
        return this.getFlatPos(pos.x, pos.y).add(this.getNormal(pos.x, pos.y).multiply(h))
    }

    async drawStuff() {
        this.heightMap = this.heightMap || createHeightMap2()

        // translate(width / 2, height / 2)
        let minY = height
        let maxY = -height
        for (let y = 0; y < 1000; y++) {
            for (let x = 0; x < 1000; x++) {
                if (cropCircle && p(x / 1000, y / 1000).getDistance(p(0.5, 0.5)) < 0.5) {
                    const pos = this.getPos(p(x / 1000, y / 1000))
                    minY = min(minY, pos.y)
                    maxY = max(maxY, pos.y)
                }
            }
        }
        // resizeCanvas(width, maxY - minY + width / 20)
        canvas.height = maxY - minY + width / 20
        canvas.style.height = canvas.height / 2 + 'px'
        // resetMatrix()
        // background(bgColor)
        ctx.fillStyle = bgColor.get()
        ctx.fillRect(0, 0, width, height)
        // translate(width / 2, -minY + width / 40)
        ctx.translate(width / 2, -minY + width / 40)



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
                    const d = p5.Vector.dot(n, createVector(-1, .2, .4).normalize())
                    clr = normalLightTechnique(clr, d)
                }

                // stroke(clr)
                ctx.strokeStyle = clr.get()

                if (y == 0) drawPoint(pixelPos)
                else drawLine(lastPositions[x], pixelPos)
                lastPositions[x] = pixelPos


                // stroke(bgColor)
                ctx.strokeStyle = bgColor.get()
                // line(pixelPos.x, pixelPos.y + 1, pixelPos.x, pixelPos.y + height)

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

const drawLine = (p1, p2) => {
    ctx.lineWidth = .5
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
}
const drawPoint = (pos) => {
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
}
const lerpPoint = (p1, p2, t) => p(lerp(p1.x, p2.x, t), lerp(p1.y, p2.y, t))

const map = (v, a, b, c, d) => (v - a) / (b - a) * (d - c) + c
const lerp = (a, b, t) => (1 - t) * a + t * b
const clerp = (a, b, t) => {
    if (t < 0) return a
    if (t > 1) return b
    return lerp(a, b, t)
}
const cmap = (v, a, b, c, d) => clerp(c, d, map(v, a, b, 0, 1))

class Color{
    constructor(r = 0, g = 0, b = 0, a = 255){
        this.r = r; this.g = g; this.b = b; this.a = a
    }
    copy(){
        return new Color(this.r, this.g, this.b, this.a)
    }
    get(){
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a / 255})`
    }
}
const lerpColor = (c1, c2, t) => {
    const r = lerp(c1.r, c2.r, t)
    const g = lerp(c1.g, c2.g, t)
    const b = lerp(c1.b, c2.b, t)
    const a = lerp(c1.a, c2.a, t)
    return new Color(r, g, b, a)
}

const easeQuadInOut = t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t

// smooth cmap, using quadratic bezier curve
const csmap = (v, a, b, c, d) => {
    let t = cmap(v, a, b, 0, 1)
    t = easeQuadInOut(t)
    return clerp(c, d, t)
}



lightShadowTechniques = [
    (v, h) => (v > 0) ? lightClr : shadowClr,
    (v, h) => {
        if (v > 0) return lerpColor(lightClr, lightClr2, v)
        else return lerpColor(shadowClr, shadowClr2, -v)
    },
    (v, h) => lerpColor(shadowClr, lightClr, (v + 1) / 2),
]

normalLightTechniques = [
    (clr, d) => d ** 12 > .3 ? lightClr2 : clr,
    (clr, d) => d ** 12 > .3 ? color(255) : color(0),
    (clr, d) => (abs((d * 10) % 1) < .5) ? lerpColor(clr, lightClr2, d * 2) : clr,
    (clr, d) => (abs((d * 10) % 1) < .5) ? lerpColor(clr, color(255), d * 2) : color(0)
]