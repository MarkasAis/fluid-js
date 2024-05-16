const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect(), // abs. size of element
      scaleX = canvas.width / rect.width,    // relationship bitmap vs. element for x
      scaleY = canvas.height / rect.height;  // relationship bitmap vs. element for y
  
    return {
      x: (evt.clientX - rect.left) * scaleX,   // scale mouse coordinates after they have
      y: (evt.clientY - rect.top) * scaleY     // been adjusted to be relative to element
    }
  }

let mouseDown = false;
let pos = null;
let prevPos = null;

const downListener = () => {
    mouseDown = true;
}
const moveListener = (e) => {
    pos = getMousePos(canvas, e);

    if (pos != null && mouseDown) {
        let vx = 0;
        let vy = 0;
        if (prevPos != null) {
            vx = pos.x - prevPos.x;
            vy = pos.y - prevPos.y;
        }

        let x = Math.floor(pos.x);
        let y = Math.floor(pos.y);
        paint(x, y, vx, vy, 5);
        // if (x >= 0 && x < N && y >= 0 && y < N) {
        //     addDensity(x, y, 100);
        //     addVelocity(x, y, vx, vy);
        // }
    }

    prevPos = pos;
}

function paint(cx, cy, vx, vy, r) {
    for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
            let d = Math.sqrt(dx*dx + dy*dy);
            if (d > r) continue;
            let x = cx + dx;
            let y = cy + dy;
            
            d++;

            if (x < 0 || x >= N || y < 0 || y >= N) continue;
            addDensity(x, y, 3000 / (r*r) / d);
            addVelocity(x, y, vx / d / 100, vy / d / 100);
        }
    }
}

const upListener = () => {
    mouseDown = false;
}

addEventListener('mousedown', downListener)
addEventListener('mousemove', moveListener)
addEventListener('mouseup', upListener)

function render() {
    var imageData = ctx.createImageData(N, N);
    var pixelData = imageData.data;

    // Loop through the float array and set pixel data
    for (var i = 0; i < density.length; i++) {
        var grayscaleValue = Math.round(density[i]);
        // if (grayscaleValue < 0 || grayscaleValue > 255) console.log(grayscaleValue);
        var pixelIndex = i * 4; // Each pixel occupies 4 consecutive elements: red, green, blue, and alpha

        // Set pixel color
        pixelData[pixelIndex] = grayscaleValue;     // Red
        pixelData[pixelIndex + 1] = grayscaleValue; // Green
        pixelData[pixelIndex + 2] = grayscaleValue; // Blue
        pixelData[pixelIndex + 3] = 255;            // Alpha (fully opaque)
    }

    // Put the modified pixel data back onto the canvas
    ctx.putImageData(imageData, 0, 0);
}

function update() {
    if (pos != null && mouseDown) {
        let vx = 0;
        let vy = 0;
        if (prevPos != null) {
            vx = pos.x - prevPos.x;
            vy = pos.y - prevPos.y;
        }

        let x = Math.floor(pos.x);
        let y = Math.floor(pos.y);
        paint(x, y, vx, vy, 5);
        // if (x >= 0 && x < N && y >= 0 && y < N) {
        //     addDensity(x, y, 100);
        //     addVelocity(x, y, vx, vy);
        // }
    }

    prevPos = pos;

    
    // console.log(vx);
}

function fixedUpdate() {
    step();
    fade();
    render();
}

function fade() {
    for (var i = 0; i < density.length; i++) {
        density[i] = clamp(0.99 * density[i], 0, 255);
    }
}

function clamp(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
}

setInterval(fixedUpdate, 1000/60);
// setInterval(update, 1000/240);