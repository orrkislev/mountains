function initP5(show = false, webgl = false, ratio) {
    if (ratio){
        if (windowWidth < windowHeight * ratio) {
        p5Canvas = createCanvas(windowWidth, windowWidth / ratio, webgl ? WEBGL : null)
        } else {
        p5Canvas = createCanvas(windowHeight * ratio, windowHeight, webgl ? WEBGL : null)
        }
    } else {
        p5Canvas = createCanvas(windowWidth, windowHeight, webgl ? 'webgl' : 'p2d');
    }
    ctx = drawingContext
    PS = width / 500
    noiseSeed(round_random(1000))
    angleMode(DEGREES)
    if (!show) p5Canvas.elt.style.display = 'none'
    V = createVector
}

// p5.RendererGL.prototype._initContext = function () {
//     try {
//         this.drawingContext =
//             this.canvas.getContext('webgl2', this._pInst._glAttributes) ||
//             this.canvas.getContext('webgl', this._pInst._glAttributes) ||
//             this.canvas.getContext('experimental-webgl', this._pInst._glAttributes);
//         if (this.drawingContext === null) {
//             throw new Error('Error creating webgl context');
//         } else {
//             const gl = this.drawingContext;
//             gl.enable(gl.DEPTH_TEST);
//             gl.depthFunc(gl.LEQUAL);
//             gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
//             this._viewport = this.drawingContext.getParameter(
//                 this.drawingContext.VIEWPORT
//             );
//         }
//     } catch (er) {
//         throw er;
//     }
// };

function initPaper(show = false) {
    paperCanvas = document.createElement('canvas');
    paperCanvas.width = width || windowWidth;
    paperCanvas.height = height || windowHeight
    width = width || windowWidth
    height = height || windowHeight
    paper.setup(paperCanvas);

    
    // document.body.appendChild(paperCanvas);
    document.querySelector('main').appendChild(paperCanvas);

    paperCanvas.style.display = 'block';
    if (!show) paperCanvas.style.display = 'none';

    window.Path = paper.Path,
    window.Circle = paper.Path.Circle,
    window.Rectangle = paper.Path.Rectangle,
    window.Point = paper.Point,
    window.Color = paper.Color,
    window.Group = paper.Group,
    window.CompoundPath = paper.CompoundPath,
    window.Segment = paper.Segment,
    window.Size = paper.Size
}