mapX = 3500
mapY = 3500

const ns_xl = mapX * .88
const ns_sm = mapX * .3
function getSwirlPosition(x, y) {
    let a = noise(x / ns_xl, y / ns_xl) * 360 * 3
    let r = (noise(x / ns_xl, y / ns_xl) - .5) * mapX
    let offsetX = Math.floor(cos(a) * r)
    let offsetY = Math.floor(sin(a) * r)

    a = noise(y / ns_sm, x / ns_sm) * 360 * 6
    r = (noise(y / ns_sm, x / ns_sm) - .5) * mapX * .2
    offsetX += Math.floor(cos(a) * r)
    offsetY += Math.floor(sin(a) * r)
    return [x + offsetX, y + offsetY]
}

function applyTerrain(heightMap) {
    heightMap.loadPixels()
    for (let x = 0; x < mapX; x++) {
        for (let y = 0; y < mapY; y++) {
            const [swirlX, swirlY] = getSwirlPosition(x, y)
            const v = getTerrain(swirlX / mapX, swirlY / mapY) * 4
            const i = (x + y * mapX) * 4
            for (j = 0; j < floor(v); j++) {
                heightMap.pixels[i + j] = 255
            }
            heightMap.pixels[i + j] = 255 * (v - floor(v))
        }
    }
    // heightMap.updatePixels()
}

function getTerrain(x, y) {
    const relPos = p(x, y).subtract(p(0.5, 0.5))

    let v = noise(x * 4, y * 8) ** 4 * .4 + noise(x * 80, y * 80) ** 3 * .05
    // v = noise(x * 15, y * 2) * .4
    // v += noise(x * 100, y * 100) * .02
    // v += noise(x * 6, y * 6) ** 2 * .1

    v = csmap(relPos.length, .0, .5, 1, v)
    v = csmap(relPos.length, 0.0, 0.1, 0, v)
    // v = csmap(relPos.length, .4, .5, v, 0)

    // v = csmap(relPos.length, .4, .45, v, v+.1)
    // v = csmap(relPos.length, .45, .5, v, v-.1)

    // v = (sin(relPos.length * 10 * 360) + 1) / 2
    // v = cmap(relPos.length, 0, 1, v, 0)
    return v
}




function createHeightMap(m) {
    heightMap = createGraphics(mapX, mapY)
    heightMap.background(0)
    heightMap.pixelDensity(1)
    heightMap.noStroke()

    applyTerrain(heightMap)

    // applyNoiseSwirl(heightMap)

    // const circles = []
    // heightMap.drawingContext.filter = `blur(30px)`
    // for (let i = 0; i < 30; i++) {
    //     const r = random(100, 1000)
    //     const x = random(r,mapX-r)
    //     const y = random(r,mapY-r)
    //     if (!circles.some(c => p(x, y).getDistance(p(c.x, c.y)) < c.r + r)) {
    //         circles.push({ x, y, r })
    //         heightMap.fill(random(100, 150))
    //         heightMap.circle(x, y, r * 1.6 - 30)
    //         heightMap.fill(0,0,255)
    //         heightMap.circle(x, y, r - 30)
    //     }
    // }

    // heightMap.drawingContext.filter = `blur(30px)`
    // heightMap.translate(mapX / 2, mapY / 2)
    // heightMap.strokeWeight(30)
    // heightMap.stroke(0)
    // heightMap.line(-400, 0, 400, 0)
    // heightMap.line(0, -400, 0, 400)

    // heightMap.drawingContext.filter = `blur(600px)`
    // heightMap.fill(255, 0, 0)
    // heightMap.circle(mapX / 2, mapY / 2, 3000)
    // heightMap.drawingContext.filter = `blur(10px)`
    // heightMap.fill(0,0,255)
    // heightMap.circle(mapX / 2, mapY / 2, 400)

    // let v = createVector(mapX / 2,0)
    // heightMap.translate(mapX / 2, mapY / 2)
    // heightMap.drawingContext.filter = `blur(20px)`
    // for (let i = 0; i < mapX / 2; i++) {
    //     heightMap.fill(csmap(i, 0, mapX / 2, 0, 255))
    //     heightMap.circle(v.x, v.y, map(i, 0, mapX / 2, 200, 40))
    //     v.rotate(3)
    //     if (i % 36 == 0) v.rotate(2)
    //     v.setMag(csmap(i, 0, mapX / 2, mapX/2, 0))
    // }


    // for (let i = 0; i < 500; i++) {
    //     const x = random(mapX)
    //     const y = random(mapY)
    //     const r = random(400, 800)
    //     heightMap.fill(random() ** 3 * 255)
    //     heightMap.push()
    //     heightMap.translate(x, y)
    //     heightMap.rotate(random(360))
    //     // heightMap.circle(x, y, r)
    //     // if (random()<.8) heightMap.drawingContext.filter = `blur(50px)`
    //     heightMap.rect(-r / 2, -r / 2, r, r)
    //     heightMap.pop()
    // }

    // applyNoiseSwirl(heightMap)

    // heightMap.loadPixels()
    // push()
    // resetMatrix()
    // image(heightMap, 0, 0,width,height)
    // pop()
    return heightMap
}

function applyNoiseSwirl(heightMap) {
    heightMap.loadPixels()
    const oldPixels = heightMap.pixels.slice()
    const ns_xl = mapX * .88
    const ns_sm = mapX * .3
    for (let x = 0; x < mapX; x++) {
        for (let y = 0; y < mapY; y++) {
            const i = x + y * mapX
            let a = noise(x / ns_xl, y / ns_xl) * 360 * 1
            let r = (noise(x / ns_xl, y / ns_xl) - .5) * mapX
            let offsetX = Math.floor(cos(a) * r)
            let offsetY = Math.floor(sin(a) * r)

            a = noise(y / ns_sm, x / ns_sm) * 360 * 6
            r = (noise(y / ns_sm, x / ns_sm) - .5) * mapX * .2
            offsetX += Math.floor(cos(a) * r)
            offsetY += Math.floor(sin(a) * r)
            const i2 = (x + offsetX + (y + offsetY) * mapX) * 4
            heightMap.pixels[i * 4] = oldPixels[i2]
            heightMap.pixels[i * 4 + 1] = oldPixels[i2 + 1]
            heightMap.pixels[i * 4 + 2] = oldPixels[i2 + 2]
        }
    }
    heightMap.updatePixels()
}