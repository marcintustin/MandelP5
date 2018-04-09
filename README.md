# MandelP5

## What is this

Functionally, this is a live demo of making a mandelbrot set viewer in 129 lines of JS (for the absolute minimum), and basic html and css boilerplate.

What it's really for is as a quick tutorial on p5.js. I believe that p5.js a really simple way to make dynamic websites, compatible with maintaining a core experience that is js free. This project doesn't have those non-canvas parts yet, but those are planned. What I certainly can say is that p5.js is the web framework that I have picked up the most easily, and with the least boilerplate. 


## How was it made


1. `index.html` and `main.css` taken from the processing desktop app templates

2. Added this line to the `index.html`, in order to include math.js for its complex number facilities: `<script src="https://cdnjs.cloudflare.com/ajax/libs/mathjs/4.0.0/math.min.js" integrity="sha256-SXLRPQMQE3pP06076EMmcA5x6Qv5Wu0rfyH51xcMd8c=" crossorigin="anonymous"></script>`

3. Comment out the commented out lines in `main.css`

4. Write the code now in `drawMandelbrot` (then in `draw`) and `nonDivergentMandelbrotIteration` (see [this gist](https://gist.github.com/marcintustin/908ace50363598cd9bf5712da7963deb#file-sketch-js)). Calculation taken from the wikipedia page on the [mandelbrot set](https://en.wikipedia.org/wiki/Mandelbrot_set). 

5. Realise that one reason why the performance in that version was so terrible is that p5.js provides an event loop, so the mandelbrot set was being recalculated repeatedly. Add [this line to disable the event loop](https://gist.github.com/marcintustin/908ace50363598cd9bf5712da7963deb#file-sketch-js-L26) (we'll restore it later).

6. [Add monochrome colorization](https://github.com/marcintustin/MandelP5/commit/d6232741221f721c97292f1a493627d48250e2e1#diff-9f2094443505273ff51ea1d1702e4367R52), by unconditionally drawing a point on every point in the plane, and setting its brightness based on how many iterations it took to escape to "infinity" (actually 4). Specifically, the ratio between the number of iterations and the maximum before it is assumed to converge. 

7. Add color colorization by using that same ratio [choose a color linearly interpolated between two colors](https://github.com/marcintustin/MandelP5/commit/72582a28c6d044bba110772625bc8ab6610f6f66#diff-9f2094443505273ff51ea1d1702e4367R68).

8. Start drawing rectangles on the screen:

   8.1. Use the `mousePressed` (for when the user first presses their mouse or screen) and `mouseDragged` (to update the current coordinate of the other corner of the rectangle) event handlers to capture the co-ordinates chosen to zoom.

   8.2. For this to actually work, we need to reinstate the event loop, and [delete noLoop](https://github.com/marcintustin/MandelP5/commit/7908d7df6fe90bc044b8aa3dc72ea06704bf675d#diff-9f2094443505273ff51ea1d1702e4367L36).

   8.3. But, we still don't want to have to recalculate the whole set on every frame. So, we [draw the image to a buffer](https://github.com/marcintustin/MandelP5/commit/7908d7df6fe90bc044b8aa3dc72ea06704bf675d#diff-9f2094443505273ff51ea1d1702e4367R53), and [draw the buffer to the canvas on each frame](https://github.com/marcintustin/MandelP5/commit/7908d7df6fe90bc044b8aa3dc72ea06704bf675d#diff-9f2094443505273ff51ea1d1702e4367R96). It is worth mentioning that another not-super-documented feature is the [`pixelDensity`](https://p5js.org/reference/#/p5/pixelDensity) of canvases is inherited from the top level; and if it is larger than 1, the graphics buffer will scale, and you will see less than the whole image on the canvas. For that reason, we [set the `pixelDensity` to 1](https://github.com/marcintustin/MandelP5/commit/7908d7df6fe90bc044b8aa3dc72ea06704bf675d#diff-9f2094443505273ff51ea1d1702e4367R31).

   8.4. Because the point of these rectangles is to define the zoom area, it makes sense to keep them the same aspect ratio as the canvas. Whichever dimension of the "real" rectangle is shorter is [scaled to match the aspect ratio of the canvas](https://github.com/marcintustin/MandelP5/commit/7908d7df6fe90bc044b8aa3dc72ea06704bf675d#diff-9f2094443505273ff51ea1d1702e4367R104).

9. It would be nice if the image scaled with the size of the window. Fortunately, p5 provides a [`windowResized`](https://github.com/marcintustin/MandelP5/commit/7908d7df6fe90bc044b8aa3dc72ea06704bf675d#diff-9f2094443505273ff51ea1d1702e4367R48) handler, and a method to resize the canvas. We also [create a new buffer](https://github.com/marcintustin/MandelP5/commit/7908d7df6fe90bc044b8aa3dc72ea06704bf675d#diff-9f2094443505273ff51ea1d1702e4367R52) to draw the set on, that matches the size of the canvas.

10. Let's actually use those rectangles to zoom. Fortunately, we're already [mapping explicitly from the complex plane to the co-ordinate space of the canvas](https://github.com/marcintustin/MandelP5/commit/7908d7df6fe90bc044b8aa3dc72ea06704bf675d#diff-9f2094443505273ff51ea1d1702e4367R24). We use the `mouseReleased` event handler to [actually trigger zooming](https://github.com/marcintustin/MandelP5/commit/2f7decdd6ca7ff83bb8d02833cd9eb63e1865ac4#diff-9f2094443505273ff51ea1d1702e4367R77). In short, we use the existing mapping of canvas-space co-ordinates to find the new bounds, and update the range and offset parameters to create a new mapping.

11. And we're caught up with the current state of the code!

## What's left to do

In no particular order (because I'm _agile_):

- [ ] Hardware acceleration with [gpu.js](http://gpu.rocks/)
- [ ] Adaptive iteration depth, so when you zoom, you get more detail
- [ ] Rectangle goes away when you zoom
- [ ] Make drawing a rectangle not also drag on mobile
- [ ] Make it play nicely with mobile web browsers that remove/add chrome on the top and bottom of the display
- [ ] Interactive palette control
