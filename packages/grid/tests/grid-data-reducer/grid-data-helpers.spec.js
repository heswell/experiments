const { bufferMinMax } = require('../dist/index.js');


describe('bufferMinMax', () => {
 
   test('1', () => {

    const [min, max] = bufferMinMax({lo:280, hi: 300}, 1247, 100, 100);

    expect(min).toBe(280);
    expect(max).toBe(500);

   }) 

})