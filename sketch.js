"use strict";

var max_x
var max_y
var max_diag

// used for rectangle normalisation, needed for zooming
var aspectRatio;

var viewBounds = {
  actual_height_range: 2,
  actual_height_offset: -1,

  actual_width_range: 3,
  actual_width_offset: -2
};

var divergence_threshold = 2
// Decent balance between "smoothness" and resolution on the set
var max_iterations = 25;

var fromColor;
var toColor;
var mbBuffer;

var startRect = null;
var endRect = null;

function pixelToComplex(x, y, bounds) {
  var imag = (y / max_y) * bounds.actual_height_range + bounds.actual_height_offset;
  var real = (x / max_x) * bounds.actual_width_range + bounds.actual_width_offset;
  return math.complex(real, imag)
}

function setup() {
  pixelDensity(1);
  background(255)
  colorMode(HSB);
  blendMode(REPLACE);
  strokeWeight(0.1)
  
  fromColor = color('hsba(160, 100%, 50%, 1)');
  toColor = color('hsba(20, 100%, 100%, 1)');
  
  // needed to set up globals
  windowResized();
  
  createCanvas(max_x, max_y);
  stroke(255) // for rectangle
  noFill() // also for rectangle
}

var gpu = new GPU();

function windowResized() {
  max_x = windowWidth
  max_y = windowHeight
  max_diag = math.sqrt(math.pow(windowHeight, 2) + math.pow(windowWidth, 2))

  resizeCanvas(max_x, max_y);
  mbBuffer = createGraphics(max_x, max_y)
  aspectRatio = max_x / max_y;

  var mandelVals = gpu.createKernel(
    function mvals(realParts, imagParts){
      // I am completely confused as to why y and x have to be transposed here
      // something to do with transfer to gpu, I think
      var value_real = realParts[this.thread.y][this.thread.x];
      var value_imag = imagParts[this.thread.y][this.thread.x];
      var c_real = value_real;
      var c_imag = value_imag;
      var num_iterations = 0;
      var abs_val_squared = 0; // not really but let's not repeat ourselves
      while (abs_val_squared <= this.constants.divergence_threshold_squared &&
             num_iterations <= this.constants.max_iterations) {
        num_iterations += 1;
        var value_real_new = (value_real * value_real) - (value_imag * value_imag) + c_real
        var value_imag_new = ((value_real * value_imag) * 2) + c_imag;
        value_real = value_real_new;
        value_imag = value_imag_new;
        abs_val_squared = (value_real * value_real) + (value_imag * value_imag)
      }
      // scaled escape value
      return num_iterations/this.constants.max_iterations;
    },
    {
      constants: {
        max_iterations: max_iterations,
        divergence_threshold_squared: divergence_threshold * divergence_threshold
      }
    }).setOutput([max_y, max_x]);

  drawMandelbrot(mbBuffer, mandelVals)

}

function mousePressed() {
  startRect = createVector(mouseX, mouseY)
}

function mouseDragged() {
  var dragEndRect = createVector(mouseX, mouseY)
  var diff = p5.Vector.sub(dragEndRect,startRect);
  var width = diff.x
  var height = diff.y
  var scaleFactor = diff.mag() / max_diag;
  // normalise to aspect ratio of screen
  width   = max_x * scaleFactor * math.sign(width)
  height  = max_y * scaleFactor * math.sign(height)
  endRect = p5.Vector.add(startRect, createVector(width, height))
}

function mouseReleased() {

  // Refuse to do anything if bounds have not been chosen
  if(! (startRect && endRect)) {
    return;
  }
  // figure out visual limits of rectangle so that we can find the actual top left and bottom right
  // need to pass math.subtract to get numerical sort
  var xCoords = [startRect.x, endRect.x].sort(math.subtract)
  var yCoords = [startRect.y, endRect.y].sort(math.subtract)

  // screen co-ordinates are origin in top left
  var topLeft = createVector(xCoords[0], yCoords[0])
  var bottomRight = createVector(xCoords[1], yCoords[1])
  // adjust actual_{height,width}_offset to top left of rectangle (startRect)
  var newTopCorner = pixelToComplex(topLeft.x, topLeft.y, viewBounds)
  // adjust actual_{height,width}_range to height/width of rectangle (diff)
  var newBottomCorner = pixelToComplex(bottomRight.x, bottomRight.y, viewBounds)
  var newDimensions = newBottomCorner.sub(newTopCorner)
  var oldViewBounds = viewBounds
  viewBounds = {
    actual_width_offset: newTopCorner.re,
    actual_height_offset: newTopCorner.im,

    actual_width_range: newDimensions.re,
    actual_height_range: newDimensions.im
  }

  console.assert(viewBounds.actual_height_range > 0)
  console.assert(viewBounds.actual_width_range > 0)

  //console.log("Rectangle bounds: ", startRect, endRect)
  //console.log("Sorted co-ords: ", xCoords, yCoords)
  //console.log("Old and new view bounds", oldViewBounds, viewBounds);
  
  // TODO: Increase number of iterations to get more detail
  startRect = null; // don't draw a rectangle
  endRect = null;
  windowResized()
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

function drawMandelbrot(g, mandelVals) {

  // TODO: Don't visit every point in the plane
  // We could just compute the values for every x and every y separately, and
  // read off the x and y for each point
  var realParts = Array.from({ length: max_x+1 }, function() { return Array.from({ length:  max_y+1 })});
  var imagParts = Array.from({ length: max_x+1 }, function() { return Array.from({ length:  max_y+1 })});
  for (var x = 0; x < max_x; x++) {
    for (var y = 0; y < max_y; y++) {
      var pxAsComplex = pixelToComplex(x, y, viewBounds);
      realParts[x][y] = pxAsComplex.re
      imagParts[x][y] = pxAsComplex.im      
    }
  }
  //var mandelVal = nonDivergentMandelbrotIteration(pxAsComplex);
  var computedMandelVals =  mandelVals(realParts, imagParts);
  for (var x = 0; x < max_x; x++) {
    for (var y = 0; y < max_y; y++) {
      var trueColor = lerpColor(fromColor, toColor, computedMandelVals[x][y]);
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
    rect(startRect.x, startRect.y, diff.x, diff.y)
  }
}

/* Catch exception if we're in a browser */
try {
  module.exports = {
    nonDivergentMandelbrotIteration,
    drawMandelbrot
  };
} catch (error){
  console.log(error)
}
