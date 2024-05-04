let circles = []

const withSmallNoise = random() < .5
const withDisplacement = random() < .5
const withBowl = random() < .5
const useCircles = random() < .7
const withManMade = random() < .5
const withHill = true

function createHeightMap2() {
    const shaderGraphics = createGraphics(mapX, mapY, WEBGL)
    shaderGraphics.pixelDensity(1)

    if (useCircles) {
        for (let i = 0; i < 1000; i++) {
            const r = random(100, 1500)
            const x = random(r, mapX - r)
            const y = random(r, mapY - r)
            if (!circles.some(c => p(x, y).getDistance(p(c.x, c.y)) < c.r / 2 + r / 2)) {
                circles.push({ x, y, r })
            }
        }
    }

    const shdr = shaderGraphics.createShader(BasicVertexShader, getFrag())
    shaderGraphics.shader(shdr)
    shdr.setUniform('mapRes', [mapX, mapY])
    shdr.setUniform('noiseOffset', [random(1000), random(1000)])
    shaderGraphics.rect(0, 0, mapX, mapY)

    if (withManMade) {
        const shdr2 = shaderGraphics.createShader(BasicVertexShader, manmadeFrag)
        shaderGraphics.shader(shdr2)
        shdr2.setUniform('mapRes', [mapX, mapY])
        shdr2.setUniform('tex0', shaderGraphics)
        shaderGraphics.rect(0, 0, mapX, mapY)
    }

    shaderGraphics.loadPixels()

    return shaderGraphics
}

const manmadeFrag = `
precision highp float;
varying vec2 vTexCoord;
uniform vec2 mapRes;
uniform sampler2D tex0;

${lerpStuff}

void main(){
    vec2 pixelPos = vTexCoord * mapRes;
    vec2 center = mapRes * vec2(.5);
    vec2 dir = pixelPos - center;
    float dist = length(dir);
    float angle = atan(dir.y, dir.x);
    float angleOffset = csmap(dist, 0.0, 1000.0, 3.14, 0.0);
    angle += angleOffset;

    vec2 newPixelPos = center + vec2(cos(angle), sin(angle)) * dist;
    vec2 newTexCoord = newPixelPos / mapRes;
    gl_FragColor = texture2D(tex0, newTexCoord);
}
`

const getFrag = () => {
    return `
    precision highp float;
    varying vec2 vTexCoord;
    uniform vec2 mapRes;

    #define PI 3.14159265359
    
    ${noise2d}
    ${glsl_applyHeight}
    ${lerpStuff}

    float smootherstep(float edge0, float edge1, float x) {
        x = clamp((x - edge0)/(edge1 - edge0), 0., 1.);
        return x * x * x * (x * (x * 6. - 15.) + 10.);
    }


    void main(){
        vec2 pos = vTexCoord;
        ${withDisplacement ? `
            float ns_xl = ${random().toFixed(2)};
            float ns_sm = ${random(2).toFixed(2)};

            float a = noise2d(vTexCoord * ns_xl) * PI * 2.0 * 2.0;
            float r = (noise2d(vTexCoord * ns_xl + 1000.0) - .5) * ${random().toFixed(2)};
            vec2 offset = vec2(cos(a), sin(a)) * r;

            a = noise2d(vTexCoord * ns_sm) * PI * 2.0 * 3.0;
            r = (noise2d(vTexCoord * ns_sm + 1000.0) - .5) * .1;
            offset += vec2(cos(a), sin(a)) * r;

            pos += offset;
        ` : ''}

        vec2 relPos = pos - vec2(0.5);

        float d = length(relPos);
        float d2 = length(vTexCoord - vec2(0.5));
        
        ${choose(noiseWays)}
        ${withSmallNoise ? choose(smallNoise) : ''}

        ${withHill ? choose(hillsWays) : ''}

        // v = 0.0;
        ${circles.map((c, i) => `
            {
                vec2 circlePos = vec2(${c.x / mapX}, ${c.y / mapY});
                float dist = length(circlePos - vTexCoord);
                v = csmap(dist, 0.0, ${c.r / mapX}, ${random()}, v);
                v = csmap(dist, 0.0, ${(c.r / mapX) * .7}, 0.0, v);
                // v = max(v, 1.0 - smootherstep(0.0, ${(c.r / mapX) * .2}, dist));
                // v = max(v, 1.0 - smootherstep(0.0, .5, dist));
            }
        `).join('')}

        ${withBowl ? `v = cmap(d2, 0.3, .5, v, ${random() ** 2 * .5});` : ''}


        v *= 4.0;
        vec4 clr = applyHeight(v);
        gl_FragColor = clr;
    }    
    `
}




const BasicVertexShader = `
    attribute vec3 aPosition;
    attribute vec2 aTexCoord;
    varying vec2 vTexCoord;

    void main() {
        vTexCoord = aTexCoord;
        vec4 positionVec4 = vec4(aPosition, 1.0);
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
        positionVec4.y *= -1.0;
        gl_Position = positionVec4;
    }`


const noiseWays = [
    `vec2 noisePos = pos * 4.0;
        float noiseVal = noise2d(noisePos);
        float n1 = noise2d(noisePos + vec2(0.01,0.0));
        float n2 = noise2d(noisePos + vec2(-0.01,0.0));
        float n3 = noise2d(noisePos + vec2(0.0,0.02));
        float n4 = noise2d(noisePos + vec2(0.0,-0.02));
        float abs_slope = abs(n3 - n4);
        float v = abs_slope * 6.0;`,

    `float v = pow(noise2d(relPos * vec2(4.0,8.0)), 4.0) * 0.4;`,
]
const smallNoise = [
    `v += pow(noise2d(relPos * 80.0), 3.0) * 0.05;`,
    `v += noise2d(relPos * 120.0) * noise2d(relPos * 1.0) * 0.05;`,
    `v += noise2d(relPos * 180.0) * 0.01;`
]

const hillsWays = [
    `v = csmap(d, 0.0, 0.5, 1.0, v);
     v = csmap(d, 0.0, 0.1, 0.0, v);`,
    `v = csmap(d,0.0,0.5,(sin(d * 3.0 * PI * 2.0) + 1.0) / 3.0,v);`,
    `v = v / 4.0 + (sin(d * 5.0 * PI * 2.0) + 1.0) / 4.0;`
]