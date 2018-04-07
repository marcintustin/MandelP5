var max_x
var max_y

// used for rectangle normalisation, needed for zooming
var aspectRatio;

var actual_height_range = 2
var actual_height_offset = -1

var actual_width_range = 3
var actual_width_offset = -2;

var divergence_threshold = 4
// Decent balance between "smoothness" and resolution on the set
var max_iterations = 25;

var fromColor;
var toColor;
var mbBuffer;

var startRect = null;
var endRect = null;

function pixelToComplex(x, y) {
  imag = (y / max_y) * actual_height_range + actual_height_offset;
  real = (x / max_x) * actual_width_range + actual_width_offset;
  return math.complex(real, imag)
}

function setup() {
  pixelDensity(1);
  background(255)
  colorMode(HSB);
  blendMode(ADD);
  strokeWeight(0.1)
  
  fromColor = color('hsba(160, 100%, 50%, 1)');
  toColor = color('hsba(20, 100%, 100%, 1)');

  // needed to set up globals
  windowResized();
  
  createCanvas(max_x, max_y);
  stroke(255) // for rectangle
  noFill() // also for rectangle
}

function windowResized() {
  max_x = windowWidth
  max_y = windowHeight
  resizeCanvas(max_x, max_y);
  mbBuffer = createGraphics(max_x, max_y)
  drawMandelbrot(mbBuffer)
  aspectRatio = max_x / max_y;
}

function mousePressed() {
  startRect = createVector(mouseX, mouseY)
}

function mouseDragged() {
  endRect = createVector(mouseX, mouseY)
}

function mouseReleased() {
  // TODO: implement zooming
}

function nonDivergentMandelbrotIteration(c) {
  //return number of iterations until divergence
  var value = c;
  var num_iterations = 0;
  while (value.abs() <= divergence_threshold && num_iterations <= max_iterations) {
    num_iterations += 1;
    value = value.mul(value).add(c)
  }
  
  // if didn't hit max iterations, this is divergent not non-divergent
  return num_iterations;
}

function drawMandelbrot(g) {
  for (var x = 0; x < max_x; x++) {
    for (var y = 0; y < max_y; y++) {
      var pxAsComplex = pixelToComplex(x, y);
      var mandelVal = nonDivergentMandelbrotIteration(pxAsComplex);
      var trueColor = lerpColor(fromColor, toColor, mandelVal / max_iterations);
      g.stroke(trueColor);
      g.point(x,y)
    }
  }
}

function draw() {
  // draw may be called before this is created
  if(mbBuffer) {
    image(mbBuffer, 0, 0)
  }
  if(startRect && endRect) {
    var diff = p5.Vector.sub(endRect,startRect);
    var width = diff.x
    var height = diff.y
    // normalise whichever of width or height is less
    if (width <= height) {
      width = height * aspectRatio
    } else {
      height = width / aspectRatio
    }
    rect(startRect.x, startRect.y, width, height)
  }
}
