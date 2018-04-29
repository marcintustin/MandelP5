const sketch = require('./sketch');
const math = require('mathjs');

test('number of iterations for 0 to be max_iterations+1', () => {
  expect(sketch.nonDivergentMandelbrotIteration(math.complex(0,0))).toBe(26);
});
