//var x_offset = 300
//var y_offset = 200
// Defaults; should be set in setup
var max_x = 1200
var max_y = 800

var actual_height_range = 2
var actual_height_offset = -1

var actual_width_range = 3
var actual_width_offset = -2;

var divergence_threshold = 4
// Decent balance between "smoothness" and resolution on the set
var max_iterations = 25;

var fromColor;
var toColor;

function pixelToComplex(x, y) {
  imag = (y / max_y) * actual_height_range + actual_height_offset;
  real = (x / max_x) * actual_width_range + actual_width_offset;
  return math.complex(real, imag)
}

function setup() {
  colorMode(HSB);
  max_x = windowWidth
  max_y = windowHeight
  fromColor = color(218, 165, 32);
  toColor = color(20, 100, 255);
  createCanvas(max_x, max_y);
  // normally draw is called continuously
  // but this sucks for this case, because (a) our draw is expensive
  // (b) it does the same thing every time
  noLoop();
}

function windowResized() {
  max_x = windowWidth
  max_y = windowHeight
  resizeCanvas(max_x, max_y);
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

function drawMandelbrot() {
  background(51);
  stroke(150);
  point(10, 10);
  for (var x = 0; x < max_x; x++) {
    for (var y = 0; y < max_y; y++) {
      //console.log([x,y])
      var pxAsComplex = pixelToComplex(x, y);
      //var inMandelbrot = pxAsComplex.abs() < 2; 
      var mandelVal = nonDivergentMandelbrotIteration(pxAsComplex);
      stroke(lerpColor(fromColor, toColor, mandelVal / max_iterations));
      point(x,y)
    }
  }
}

function draw() {
  drawMandelbrot()
}
