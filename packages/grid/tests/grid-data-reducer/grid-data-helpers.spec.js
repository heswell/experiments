import { bufferMinMax, getFullBufferSize } from '../../src/grid-data-helpers';


describe('getFullBufferSize', () => {

   test('beginning of dataset', () => {
      const bufferSize = getFullBufferSize({lo:0, hi:10}, 100, 10);
      expect(bufferSize).toEqual(20);
   })

   test('near beginning of dataset', () => {
      const bufferSize = getFullBufferSize({lo:4, hi:14}, 100, 10);
      expect(bufferSize).toEqual(24);
   });

   test('middle of dataset', () => {
      const bufferSize = getFullBufferSize({lo:14, hi:24}, 100, 10);
      expect(bufferSize).toEqual(30);
   })

   test('near end of dataset', () => {
      const bufferSize = getFullBufferSize({lo:85, hi:95}, 100, 10);
      expect(bufferSize).toEqual(25);
   })

   test('end of dataset', () => {
      const bufferSize = getFullBufferSize({lo:90, hi:100}, 100, 10);
      expect(bufferSize).toEqual(20);
   })
})

describe('bufferMinMax', () => {
 
   test('1', () => {

    const [min, max] = bufferMinMax({lo:280, hi: 300}, 1247, 100, 100);

    expect(min).toBe(280);
    expect(max).toBe(500);

   }) 

})