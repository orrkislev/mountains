function setup(){
    createCanvas(400,400)
    grph = createGraphics(400,400,WEBGL)
    noStroke()
}

function draw(){
    background(0)
    grph.background(0)
    grph.rect(0,0,100)
    
    image(grph,0,0)
}