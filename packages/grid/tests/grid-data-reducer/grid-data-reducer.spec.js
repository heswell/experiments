const { GridDataReducer } = require('../dist/index.js');
const { rows, getRows } = require('./test-data.js');

const uniqueKeys = rows => {
  const keys = rows.map(row => row[1]);
  const uniqueKeys = new Set(keys);
  return uniqueKeys.size === keys.length;
}

describe('grid-data-reducer', () => {

  describe('initialisation', () => {
    test('init, default bufferSize', () => {
      const initialState = GridDataReducer(undefined, { type: 'clear', range: { lo: 0, hi: 20 } });
      expect(initialState).toEqual({
        bufferIdx: { lo: 0, hi: 0 },
        buffer: [],
        bufferSize: 100,
        renderBufferSize: 0,
        rows: [],
        rowCount: 0,
        range: { lo: 0, hi: 20 },
        offset: 0,
        keys: { free: [], used: {} },
        dataRequired: true
      })
    });

    test('init, custom bufferSize', () => {
      const initialState = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 20 } });
      expect(initialState).toEqual({
        bufferIdx: { lo: 0, hi: 0 },
        buffer: [],
        bufferSize: 20,
        renderBufferSize: 0,
        rows: [],
        rowCount: 0,
        range: { lo: 0, hi: 20 },
        offset: 0,
        keys: { free: [], used: {} },
        dataRequired: true
      })
    });

    test('initial load', () => {
      const initialState = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      const state = GridDataReducer(initialState, {
        type: 'data',
        offset: 100,
        rowCount: 1000,
        rows
      });

      expect(state.buffer.length).toEqual(30);
      expect(state.bufferIdx).toEqual({ lo: 0, hi: 10 });
      expect(state.rows).toEqual([
        [100, 0, 0, 0, 0, 'key-00'],
        [101, 1, 0, 0, 0, 'key-01'],
        [102, 2, 0, 0, 0, 'key-02'],
        [103, 3, 0, 0, 0, 'key-03'],
        [104, 4, 0, 0, 0, 'key-04'],
        [105, 5, 0, 0, 0, 'key-05'],
        [106, 6, 0, 0, 0, 'key-06'],
        [107, 7, 0, 0, 0, 'key-07'],
        [108, 8, 0, 0, 0, 'key-08'],
        [109, 9, 0, 0, 0, 'key-09'],
      ]);
    })
  });

  describe('FWD scrolling', () => {

    test('scroll 1 row', () => {

      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows });
      state = GridDataReducer(state, { type: 'range', range: { lo: 1, hi: 11 } });

      expect(state.dataRequired).toEqual(false);
      expect(state.buffer.length).toEqual(30);
      expect(state.bufferIdx).toEqual({ lo: 1, hi: 11 });

      const rowsOut = [
        [101, 1, 0, 0, 0, 'key-01'],
        [102, 2, 0, 0, 0, 'key-02'],
        [103, 3, 0, 0, 0, 'key-03'],
        [104, 4, 0, 0, 0, 'key-04'],
        [105, 5, 0, 0, 0, 'key-05'],
        [106, 6, 0, 0, 0, 'key-06'],
        [107, 7, 0, 0, 0, 'key-07'],
        [108, 8, 0, 0, 0, 'key-08'],
        [109, 9, 0, 0, 0, 'key-09'],
        [110, 0, 0, 0, 0, 'key-10'],
      ];

      expect(state.rows).toEqual(rowsOut);
      const rows1 = state.rows;

      // We wouldn't have requested data at this point, byt we should handle it anyway
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [130, 0, 0, 0, 0, 'key-30'],
        ]
      });

      expect(state.rows === rows1).toBe(true);
      expect(state.buffer.length).toEqual(31);

    })

    test('scroll 5 rows', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows });
      state = GridDataReducer(state, { type: 'range', range: { lo: 5, hi: 15 } });

      const rowsOut = [
        [105, 5, 0, 0, 0, 'key-05'],
        [106, 6, 0, 0, 0, 'key-06'],
        [107, 7, 0, 0, 0, 'key-07'],
        [108, 8, 0, 0, 0, 'key-08'],
        [109, 9, 0, 0, 0, 'key-09'],
        [110, 0, 0, 0, 0, 'key-10'],
        [111, 1, 0, 0, 0, 'key-11'],
        [112, 2, 0, 0, 0, 'key-12'],
        [113, 3, 0, 0, 0, 'key-13'],
        [114, 4, 0, 0, 0, 'key-14'],
      ];

      expect(state.bufferIdx).toEqual({ lo: 5, hi: 15 });
      expect(state.rows).toEqual(rowsOut);
      const rows1 = state.rows;

      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [130, 0, 0, 0, 0, 'key-30'],
          [131, 0, 0, 0, 0, 'key-31'],
          [132, 0, 0, 0, 0, 'key-32'],
          [133, 0, 0, 0, 0, 'key-33'],
          [134, 0, 0, 0, 0, 'key-34'],
        ]
      });

      expect(state.buffer.length).toEqual(35);
      expect(state.rows === rows1).toBe(true);

    });

    test('scroll beyond current viewport', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(0, 30) });

      const rowsOut = [
        [120, 0, 0, 0, 'key-020'],
        [121, 1, 0, 0, 'key-021'],
        [122, 2, 0, 0, 'key-022'],
        [123, 3, 0, 0, 'key-023'],
        [124, 4, 0, 0, 'key-024'],
        [125, 5, 0, 0, 'key-025'],
        [126, 6, 0, 0, 'key-026'],
        [127, 7, 0, 0, 'key-027'],
        [128, 8, 0, 0, 'key-028'],
        [129, 9, 0, 0, 'key-029']
      ];

      state = GridDataReducer(state, { type: 'range', range: { lo: 20, hi: 30 } });

      expect(state.buffer.length).toEqual(30);
      expect(state.rows).toEqual(rowsOut);
      expect(state.dataRequired).toEqual(true);
      expect(state.bufferIdx).toEqual({ lo: 20, hi: 30 });

      const rowsOut2 = state.rows;
      // This is purely a buffer top-up, so rows are unaffected
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: getRows(30, 50)
      });
      expect(state.rows === rowsOut2).toBe(true);
      expect(state.bufferIdx).toEqual({ lo: 20, hi: 30 });
      expect(state.buffer.length).toEqual(50);
    })

    test('scroll beyond current viewport and partially out of buffer', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(0, 30) });

      const rowsOut1 = state.rows;

      state = GridDataReducer(state, { type: 'range', range: { lo: 25, hi: 35 } });

      // No buffer pruning yet
      expect(state.dataRequired).toEqual(true);
      expect(state.buffer.length).toEqual(30);
      expect(state.bufferIdx).toEqual({ lo: 25, hi: 35 });

      // if we can't fill the full request from buffer we return existing rows, so will not render
      expect(state.rows === rowsOut1).toBe(true);

      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: getRows(30, 55)
      });

      expect(state.bufferIdx).toEqual({ lo: 20, hi: 30 });
      expect(state.buffer.length).toBe(50);
      expect(state.dataRequired).toEqual(false);
      expect(state.rows).toEqual([
        [125, 0, 0, 0, 'key-025'],
        [126, 1, 0, 0, 'key-026'],
        [127, 2, 0, 0, 'key-027'],
        [128, 3, 0, 0, 'key-028'],
        [129, 4, 0, 0, 'key-029'],
        [130, 5, 0, 0, 'key-030'],
        [131, 6, 0, 0, 'key-031'],
        [132, 7, 0, 0, 'key-032'],
        [133, 8, 0, 0, 'key-033'],
        [134, 9, 0, 0, 'key-034']
      ]);


    });

    test('jump ahead, then again', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 100, range: { lo: 0, hi: 20 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0, 120) });

      expect(state.buffer.length).toEqual(120);
      expect(state.dataRequired).toEqual(false);
      expect(state.bufferIdx).toEqual({ lo: 0, hi: 20 });

      state = GridDataReducer(state, { type: 'range', range: { lo: 243, hi: 263 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(143, 363) });

      expect(state.buffer.length).toEqual(220);
      expect(state.dataRequired).toEqual(false);
      expect(state.bufferIdx).toEqual({ lo: 100, hi: 120 });

      state = GridDataReducer(state, { type: 'range', range: { lo: 637, hi: 657 } });

      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(537, 757) });

      expect(state.buffer.length).toEqual(220);
      expect(state.dataRequired).toEqual(false);
      expect(state.bufferIdx).toEqual({ lo: 100, hi: 120 });

      expect(state.rows).toEqual([
        [737, 0, 0, 0, 'key-637'],
        [738, 1, 0, 0, 'key-638'],
        [739, 2, 0, 0, 'key-639'],
        [740, 3, 0, 0, 'key-640'],
        [741, 4, 0, 0, 'key-641'],
        [742, 5, 0, 0, 'key-642'],
        [743, 6, 0, 0, 'key-643'],
        [744, 7, 0, 0, 'key-644'],
        [745, 8, 0, 0, 'key-645'],
        [746, 9, 0, 0, 'key-646'],
        [747, 10, 0, 0, 'key-647'],
        [748, 11, 0, 0, 'key-648'],
        [749, 12, 0, 0, 'key-649'],
        [750, 13, 0, 0, 'key-650'],
        [751, 14, 0, 0, 'key-651'],
        [752, 15, 0, 0, 'key-652'],
        [753, 16, 0, 0, 'key-653'],
        [754, 17, 0, 0, 'key-654'],
        [755, 18, 0, 0, 'key-655'],
        [756, 19, 0, 0, 'key-656']
      ]);
    });

    test('jump ahead, then back', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 100, range: { lo: 0, hi: 20 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0, 120) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 978, hi: 998 } });

      expect(state.buffer.length).toEqual(120);
      expect(state.dataRequired).toEqual(true);
      expect(state.bufferIdx).toEqual({ lo: 0, hi: 0 });

      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(878, 1098) });
      expect(state.buffer.length).toEqual(220);
      expect(state.dataRequired).toEqual(false);
      expect(state.bufferIdx).toEqual({ lo: 100, hi: 120 });

      state = GridDataReducer(state, { type: 'range', range: { lo: 28, hi: 48 } });
      expect(state.buffer.length).toEqual(220);
      expect(state.bufferIdx).toEqual({ lo: 0, hi: 0 });
      expect(state.dataRequired).toEqual(true);

      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0, 148) });

      expect(state.buffer.length).toBe(148);
      expect(state.dataRequired).toEqual(false);
      expect(state.bufferIdx).toEqual({ lo: 28, hi: 48 });

      expect(state.rows).toEqual([
        [128, 0, 0, 0, 'key-028'],
        [129, 1, 0, 0, 'key-029'],
        [130, 2, 0, 0, 'key-030'],
        [131, 3, 0, 0, 'key-031'],
        [132, 4, 0, 0, 'key-032'],
        [133, 5, 0, 0, 'key-033'],
        [134, 6, 0, 0, 'key-034'],
        [135, 7, 0, 0, 'key-035'],
        [136, 8, 0, 0, 'key-036'],
        [137, 9, 0, 0, 'key-037'],
        [138, 10, 0, 0, 'key-038'],
        [139, 11, 0, 0, 'key-039'],
        [140, 12, 0, 0, 'key-040'],
        [141, 13, 0, 0, 'key-041'],
        [142, 14, 0, 0, 'key-042'],
        [143, 15, 0, 0, 'key-043'],
        [144, 16, 0, 0, 'key-044'],
        [145, 17, 0, 0, 'key-045'],
        [146, 18, 0, 0, 'key-046'],
        [147, 19, 0, 0, 'key-047']
      ]);

    });


    test('jump to end', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0, 30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70, 100) });

      expect(state.buffer.length).toBe(30);
      expect(state.rows).toEqual([
        [190, 0, 0, 0, 'key-090'],
        [191, 1, 0, 0, 'key-091'],
        [192, 2, 0, 0, 'key-092'],
        [193, 3, 0, 0, 'key-093'],
        [194, 4, 0, 0, 'key-094'],
        [195, 5, 0, 0, 'key-095'],
        [196, 6, 0, 0, 'key-096'],
        [197, 7, 0, 0, 'key-097'],
        [198, 8, 0, 0, 'key-098'],
        [199, 9, 0, 0, 'key-099']
      ]);
    });
  });

  describe('BWD scrolling', () => {

    test(`scroll back 1 row`, () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0, 30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70, 100) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 89, hi: 99 } });
      expect(state.rows).toEqual([
        [189, 9, 0, 0, 'key-089'],
        [190, 0, 0, 0, 'key-090'],
        [191, 1, 0, 0, 'key-091'],
        [192, 2, 0, 0, 'key-092'],
        [193, 3, 0, 0, 'key-093'],
        [194, 4, 0, 0, 'key-094'],
        [195, 5, 0, 0, 'key-095'],
        [196, 6, 0, 0, 'key-096'],
        [197, 7, 0, 0, 'key-097'],
        [198, 8, 0, 0, 'key-098']]);

    });

    test(`scroll back 5 row`, () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0, 30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70, 100) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 85, hi: 95 } });
      expect(state.dataRequired).toBe(false);
      expect(state.buffer.length).toBe(30);
      expect(state.rows).toEqual([
        [185, 5, 0, 0, 'key-085'],
        [186, 6, 0, 0, 'key-086'],
        [187, 7, 0, 0, 'key-087'],
        [188, 8, 0, 0, 'key-088'],
        [189, 9, 0, 0, 'key-089'],
        [190, 0, 0, 0, 'key-090'],
        [191, 1, 0, 0, 'key-091'],
        [192, 2, 0, 0, 'key-092'],
        [193, 3, 0, 0, 'key-093'],
        [194, 4, 0, 0, 'key-094']
      ]);
    });

    test(`scroll beyond buffer threshold`, () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0, 30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70, 100) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 83, hi: 93 } });
      expect(state.dataRequired).toBe(false);
      expect(state.buffer.length).toBe(30);

      state = GridDataReducer(state, { type: 'range', range: { lo: 78, hi: 88 } });
      expect(state.dataRequired).toBe(true);
      expect(state.buffer.length).toBe(30);
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(58, 70) });
      expect(state.dataRequired).toBe(false);
      expect(state.buffer.length).toBe(42);

    })

    test(`scroll beyond viewport`, () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0, 30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70, 100) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 79, hi: 89 } });

      expect(state.rows).toEqual([
        [179, 0, 0, 0, 'key-079'],
        [180, 1, 0, 0, 'key-080'],
        [181, 2, 0, 0, 'key-081'],
        [182, 3, 0, 0, 'key-082'],
        [183, 4, 0, 0, 'key-083'],
        [184, 5, 0, 0, 'key-084'],
        [185, 6, 0, 0, 'key-085'],
        [186, 7, 0, 0, 'key-086'],
        [187, 8, 0, 0, 'key-087'],
        [188, 9, 0, 0, 'key-088']
      ]);
    })


  })


  describe('growing the range', () => {

    test('first few rows', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows });
      state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 11 } });

      expect(state.rows).toEqual([
        [100, 0, 0, 0, 0, 'key-00'],
        [101, 1, 0, 0, 0, 'key-01'],
        [102, 2, 0, 0, 0, 'key-02'],
        [103, 3, 0, 0, 0, 'key-03'],
        [104, 4, 0, 0, 0, 'key-04'],
        [105, 5, 0, 0, 0, 'key-05'],
        [106, 6, 0, 0, 0, 'key-06'],
        [107, 7, 0, 0, 0, 'key-07'],
        [108, 8, 0, 0, 0, 'key-08'],
        [109, 9, 0, 0, 0, 'key-09'],
        [110, 10, 0, 0, 0, 'key-10']
      ]);

      state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 13 } });

      expect(state.rows).toEqual([
        [100, 0, 0, 0, 0, 'key-00'],
        [101, 1, 0, 0, 0, 'key-01'],
        [102, 2, 0, 0, 0, 'key-02'],
        [103, 3, 0, 0, 0, 'key-03'],
        [104, 4, 0, 0, 0, 'key-04'],
        [105, 5, 0, 0, 0, 'key-05'],
        [106, 6, 0, 0, 0, 'key-06'],
        [107, 7, 0, 0, 0, 'key-07'],
        [108, 8, 0, 0, 0, 'key-08'],
        [109, 9, 0, 0, 0, 'key-09'],
        [110, 10, 0, 0, 0, 'key-10'],
        [111, 11, 0, 0, 0, 'key-11'],
        [112, 12, 0, 0, 0, 'key-12']
      ]);

      state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 16 } });
      expect(state.dataRequired).toEqual(false);

      expect(state.rows).toEqual([
        [100, 0, 0, 0, 0, 'key-00'],
        [101, 1, 0, 0, 0, 'key-01'],
        [102, 2, 0, 0, 0, 'key-02'],
        [103, 3, 0, 0, 0, 'key-03'],
        [104, 4, 0, 0, 0, 'key-04'],
        [105, 5, 0, 0, 0, 'key-05'],
        [106, 6, 0, 0, 0, 'key-06'],
        [107, 7, 0, 0, 0, 'key-07'],
        [108, 8, 0, 0, 0, 'key-08'],
        [109, 9, 0, 0, 0, 'key-09'],
        [110, 10, 0, 0, 0, 'key-10'],
        [111, 11, 0, 0, 0, 'key-11'],
        [112, 12, 0, 0, 0, 'key-12'],
        [113, 13, 0, 0, 0, 'key-13'],
        [114, 14, 0, 0, 0, 'key-14'],
        [115, 15, 0, 0, 0, 'key-15']
      ]);

      state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 21 } });
      expect(state.dataRequired).toEqual(true);


    })

  })


  describe('buffer pruning', () => {

    test('no buffer pruning until buffer is filled', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows });
      state = GridDataReducer(state, { type: 'range', range: { lo: 5, hi: 15 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [130, 0, 0, 0, 0, 'key-30'],
          [131, 0, 0, 0, 0, 'key-31'],
          [132, 0, 0, 0, 0, 'key-32'],
          [133, 0, 0, 0, 0, 'key-33'],
          [134, 0, 0, 0, 0, 'key-34'],
        ]
      });
      expect(state.buffer.length).toEqual(35);
      state = GridDataReducer(state, { type: 'range', range: { lo: 15, hi: 25 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [135, 0, 0, 0, 0, 'key-35'],
          [136, 0, 0, 0, 0, 'key-36'],
          [137, 0, 0, 0, 0, 'key-37'],
          [138, 0, 0, 0, 0, 'key-38'],
          [139, 0, 0, 0, 0, 'key-39'],
          [140, 0, 0, 0, 0, 'key-40'],
          [141, 0, 0, 0, 0, 'key-41'],
          [142, 0, 0, 0, 0, 'key-42'],
          [143, 0, 0, 0, 0, 'key-43'],
          [144, 0, 0, 0, 0, 'key-44'],
        ]
      });
      expect(state.buffer.length).toEqual(45);
      state = GridDataReducer(state, { type: 'range', range: { lo: 20, hi: 30 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [145, 0, 0, 0, 0, 'key-45'],
          [146, 0, 0, 0, 0, 'key-46'],
          [147, 0, 0, 0, 0, 'key-47'],
          [148, 0, 0, 0, 0, 'key-48'],
          [149, 0, 0, 0, 0, 'key-49'],
        ]
      });
      expect(state.buffer.length).toEqual(50);
      state = GridDataReducer(state, { type: 'range', range: { lo: 25, hi: 35 } });
      expect(state.buffer.length).toEqual(50)

      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [150, 0, 0, 0, 0, 'key-50'],
          [151, 0, 0, 0, 0, 'key-51'],
          [152, 0, 0, 0, 0, 'key-52'],
          [153, 0, 0, 0, 0, 'key-53'],
          [154, 0, 0, 0, 0, 'key-54'],
        ]
      });
      expect(state.buffer.length).toEqual(50)

      state = GridDataReducer(state, { type: 'range', range: { lo: 22, hi: 32 } });

      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [102, 0, 0, 0, 0, 'key-02'],
          [103, 0, 0, 0, 0, 'key-03'],
          [104, 0, 0, 0, 0, 'key-04'],
        ]
      });
      expect(state.buffer.length).toEqual(50);
      expect(uniqueKeys(state.rows)).toEqual(true);


    });

    test('scroll to end', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 20 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0, 40) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 3, hi: 23 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 16, hi: 36 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(40, 56) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 46, hi: 66 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(56, 86) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 66, hi: 86 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(86, 100) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 70, hi: 90 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 75, hi: 95 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 80, hi: 100 } });

      expect(state.rows).toEqual([
        [180, 10, 0, 0, 'key-080'],
        [181, 11, 0, 0, 'key-081'],
        [182, 12, 0, 0, 'key-082'],
        [183, 13, 0, 0, 'key-083'],
        [184, 14, 0, 0, 'key-084'],
        [185, 15, 0, 0, 'key-085'],
        [186, 16, 0, 0, 'key-086'],
        [187, 17, 0, 0, 'key-087'],
        [188, 18, 0, 0, 'key-088'],
        [189, 19, 0, 0, 'key-089'],
        [190, 0, 0, 0, 'key-090'],
        [191, 1, 0, 0, 'key-091'],
        [192, 2, 0, 0, 'key-092'],
        [193, 3, 0, 0, 'key-093'],
        [194, 4, 0, 0, 'key-094'],
        [195, 5, 0, 0, 'key-095'],
        [196, 6, 0, 0, 'key-096'],
        [197, 7, 0, 0, 'key-097'],
        [198, 8, 0, 0, 'key-098'],
        [199, 9, 0, 0, 'key-099']]);

    });
  })

  describe('dataRequired', () => {

    test('no data required on snall scrolls', () => {

    })
  });

  describe('VUU type updates', () => {


    test('setRange before data arrives', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 0, range: { lo: 0, hi: 25 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 19 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 0, rowCount: 1000, rows: [
          [0, 0, 0, 0, "AAA.L", 0, null, null, null, null, "AAA.L", "AAA.L London PLC", "USD", "XLON/LSE-SETS", 633, 101, 121, "", "", "", "fastTick"],
          [1, 0, 0, 0, "AAA.N", 0, null, null, null, null, "AAA.N", "AAA.N Corporation", "EUR", "XNGS/NAS-GSM", 220, 914, 943.08, "", "", "", "fastTick"],
          [2, 0, 0, 0, "AAA.OQ", 0, null, null, null, null, "AAA.OQ", "AAA.OQ Co.", "EUR", "XNYS/NYS-MAIN", 393, 435, 439.35, "", "", "", "noop"],
          [3, 0, 0, 0, "AAA.AS", 0, null, null, null, null, "AAA.AS", "AAA.AS B.V", "GBX", "XAMS/ENA-MAIN", 449, 60, 60, "", "", "", "walkBidAsk"],
          [4, 0, 0, 0, "AAB.L", 0, null, null, null, null, "AAB.L", "AAB.L London PLC", "GBX", "XLON/LSE-SETS", 37, 205, 207.05, "", "", "", "noop"],
          [5, 0, 0, 0, "AAB.N", 0, null, null, null, null, "AAB.N", "AAB.N Corporation", "CAD", "XNGS/NAS-GSM", 38, 89, 89, "", "", "", "walkBidAsk"],
          [6, 0, 0, 0, "AAB.OQ", 0, null, null, null, null, "AAB.OQ", "AAB.OQ Co.", "GBX", "XNYS/NYS-MAIN", 286, 246, 248.46, "", "", "", "walkBidAsk"],
          [7, 0, 0, 0, "AAB.AS", 0, null, null, null, null, "AAB.AS", "AAB.AS B.V", "USD", "XAMS/ENA-MAIN", 364, 9, 9.09, "", "", "", "walkBidAsk"],
          [8, 0, 0, 0, "AAC.L", 0, null, null, null, null, "AAC.L", "AAC.L London PLC", "EUR", "XLON/LSE-SETS", 12, 72, 102, "", "", "", "fastTick"],
          [9, 0, 0, 0, "AAC.N", 0, null, null, null, null, "AAC.N", "AAC.N Corporation", "CAD", "XNGS/NAS-GSM", 927, 72, 102, "", "", "", "fastTick"],
          [10, 0, 0, 0, "AAC.OQ", 0, null, null, null, null, "AAC.OQ", "AAC.OQ Co.", "GBX", "XNYS/NYS-MAIN", 559, 704, 711.04, "", "", "", "fastTick"],
          [11, 0, 0, 0, "AAC.AS", 0, null, null, null, null, "AAC.AS", "AAC.AS B.V", "CAD", "XAMS/ENA-MAIN", 946, 655, 661.55, "", "", "", "walkBidAsk"],
          [12, 0, 0, 0, "AAD.L", 0, null, null, null, null, "AAD.L", "AAD.L London PLC", "CAD", "XLON/LSE-SETS", 363, 166, 167.66, "", "", "", ""],
          [13, 0, 0, 0, "AAD.N", 0, null, null, null, null, "AAD.N", "AAD.N Corporation", "CAD", "XNGS/NAS-GSM", 696, 166, 167.66, "", "", "", ""],
          [14, 0, 0, 0, "AAD.OQ", 0, null, null, null, null, "AAD.OQ", "AAD.OQ Co.", "EUR", "XNYS/NYS-MAIN", 806, 13, 13, "", "", "", "walkBidAsk"],
          [15, 0, 0, 0, "AAD.AS", 0, null, null, null, null, "AAD.AS", "AAD.AS B.V", "GBX", "XAMS/ENA-MAIN", 44, 929, 938.29, "", "", "", ""],
          [16, 0, 0, 0, "AAE.L", 0, null, null, null, null, "AAE.L", "AAE.L London PLC", "GBX", "XLON/LSE-SETS", 226, 474, 478.74, "", "", "", "fastTick"],
          [17, 0, 0, 0, "AAE.N", 0, null, null, null, null, "AAE.N", "AAE.N Corporation", "GBX", "XNGS/NAS-GSM", 54, 120, 140, "", "", "", "fastTick"],
          [18, 0, 0, 0, "AAE.OQ", 0, null, null, null, null, "AAE.OQ", "AAE.OQ Co.", "USD", "XNYS/NYS-MAIN", 618, 682, 688.82, "", "", "", "walkBidAsk"],
          [19, 0, 0, 0, "AAE.AS", 0, null, null, null, null, "AAE.AS", "AAE.AS B.V", "CAD", "XAMS/ENA-MAIN", 643, 245, 247.45, "", "", "", "walkBidAsk"],
          [20, 0, 0, 0, "AAF.L", 0, null, null, null, null, "AAF.L", "AAF.L London PLC", "GBX", "XLON/LSE-SETS", 690, 160, 181.23000000000002, "", "", "", "fastTick"],
          [21, 0, 0, 0, "AAF.N", 0, null, null, null, null, "AAF.N", "AAF.N Corporation", "CAD", "XNGS/NAS-GSM", 623, 160, 181.23000000000002, "", "", "", "fastTick"],
          [22, 0, 0, 0, "AAF.OQ", 0, null, null, null, null, "AAF.OQ", "AAF.OQ Co.", "USD", "XNYS/NYS-MAIN", 167, 523, 528.23, "", "", "", ""],
          [23, 0, 0, 0, "AAF.AS", 0, null, null, null, null, "AAF.AS", "AAF.AS B.V", "EUR", "XAMS/ENA-MAIN", 410, 867, 875.67, "", "", "", "noop"],
          [24, 0, 0, 0, "AAG.L", 0, null, null, null, null, "AAG.L", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"]
        ]
      });
      expect(state.buffer.length).toEqual(19);

      state = GridDataReducer(state, { type: 'range', range: { lo: 12, hi: 31 } });
      expect(state.buffer.length).toEqual(19);
      expect(state.dataRequired).toEqual(true);
      expect(state.bufferIdx).toEqual({ lo: 12, hi: 31 });

      state = GridDataReducer(state, { type: 'range', range: { lo: 29, hi: 48 } });
      expect(state.dataRequired).toEqual(true);
      expect(state.buffer.length).toEqual(19);
      expect(state.bufferIdx).toEqual({ lo: 0, hi: 0 });



    });

    test('simple update', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 0, range: { lo: 0, hi: 26 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 0, rowCount: 1000, rows: [
          [0, 0, 0, 0, "AAA.L", 0, null, null, null, null, "AAA.L", "AAA.L London PLC", "USD", "XLON/LSE-SETS", 633, 101, 121, "", "", "", "fastTick"],
          [1, 0, 0, 0, "AAA.N", 0, null, null, null, null, "AAA.N", "AAA.N Corporation", "EUR", "XNGS/NAS-GSM", 220, 914, 943.08, "", "", "", "fastTick"],
          [2, 0, 0, 0, "AAA.OQ", 0, null, null, null, null, "AAA.OQ", "AAA.OQ Co.", "EUR", "XNYS/NYS-MAIN", 393, 435, 439.35, "", "", "", "noop"],
          [3, 0, 0, 0, "AAA.AS", 0, null, null, null, null, "AAA.AS", "AAA.AS B.V", "GBX", "XAMS/ENA-MAIN", 449, 60, 60, "", "", "", "walkBidAsk"],
          [4, 0, 0, 0, "AAB.L", 0, null, null, null, null, "AAB.L", "AAB.L London PLC", "GBX", "XLON/LSE-SETS", 37, 205, 207.05, "", "", "", "noop"],
          [5, 0, 0, 0, "AAB.N", 0, null, null, null, null, "AAB.N", "AAB.N Corporation", "CAD", "XNGS/NAS-GSM", 38, 89, 89, "", "", "", "walkBidAsk"],
          [6, 0, 0, 0, "AAB.OQ", 0, null, null, null, null, "AAB.OQ", "AAB.OQ Co.", "GBX", "XNYS/NYS-MAIN", 286, 246, 248.46, "", "", "", "walkBidAsk"],
          [7, 0, 0, 0, "AAB.AS", 0, null, null, null, null, "AAB.AS", "AAB.AS B.V", "USD", "XAMS/ENA-MAIN", 364, 9, 9.09, "", "", "", "walkBidAsk"],
          [8, 0, 0, 0, "AAC.L", 0, null, null, null, null, "AAC.L", "AAC.L London PLC", "EUR", "XLON/LSE-SETS", 12, 72, 102, "", "", "", "fastTick"],
          [9, 0, 0, 0, "AAC.N", 0, null, null, null, null, "AAC.N", "AAC.N Corporation", "CAD", "XNGS/NAS-GSM", 927, 72, 102, "", "", "", "fastTick"],
          [10, 0, 0, 0, "AAC.OQ", 0, null, null, null, null, "AAC.OQ", "AAC.OQ Co.", "GBX", "XNYS/NYS-MAIN", 559, 704, 711.04, "", "", "", "fastTick"],
          [11, 0, 0, 0, "AAC.AS", 0, null, null, null, null, "AAC.AS", "AAC.AS B.V", "CAD", "XAMS/ENA-MAIN", 946, 655, 661.55, "", "", "", "walkBidAsk"],
          [12, 0, 0, 0, "AAD.L", 0, null, null, null, null, "AAD.L", "AAD.L London PLC", "CAD", "XLON/LSE-SETS", 363, 166, 167.66, "", "", "", ""],
          [13, 0, 0, 0, "AAD.N", 0, null, null, null, null, "AAD.N", "AAD.N Corporation", "CAD", "XNGS/NAS-GSM", 696, 166, 167.66, "", "", "", ""],
          [14, 0, 0, 0, "AAD.OQ", 0, null, null, null, null, "AAD.OQ", "AAD.OQ Co.", "EUR", "XNYS/NYS-MAIN", 806, 13, 13, "", "", "", "walkBidAsk"],
          [15, 0, 0, 0, "AAD.AS", 0, null, null, null, null, "AAD.AS", "AAD.AS B.V", "GBX", "XAMS/ENA-MAIN", 44, 929, 938.29, "", "", "", ""],
          [16, 0, 0, 0, "AAE.L", 0, null, null, null, null, "AAE.L", "AAE.L London PLC", "GBX", "XLON/LSE-SETS", 226, 474, 478.74, "", "", "", "fastTick"],
          [17, 0, 0, 0, "AAE.N", 0, null, null, null, null, "AAE.N", "AAE.N Corporation", "GBX", "XNGS/NAS-GSM", 54, 120, 140, "", "", "", "fastTick"],
          [18, 0, 0, 0, "AAE.OQ", 0, null, null, null, null, "AAE.OQ", "AAE.OQ Co.", "USD", "XNYS/NYS-MAIN", 618, 682, 688.82, "", "", "", "walkBidAsk"],
          [19, 0, 0, 0, "AAE.AS", 0, null, null, null, null, "AAE.AS", "AAE.AS B.V", "CAD", "XAMS/ENA-MAIN", 643, 245, 247.45, "", "", "", "walkBidAsk"],
          [20, 0, 0, 0, "AAF.L", 0, null, null, null, null, "AAF.L", "AAF.L London PLC", "GBX", "XLON/LSE-SETS", 690, 160, 181.23000000000002, "", "", "", "fastTick"],
          [21, 0, 0, 0, "AAF.N", 0, null, null, null, null, "AAF.N", "AAF.N Corporation", "CAD", "XNGS/NAS-GSM", 623, 160, 181.23000000000002, "", "", "", "fastTick"],
          [22, 0, 0, 0, "AAF.OQ", 0, null, null, null, null, "AAF.OQ", "AAF.OQ Co.", "USD", "XNYS/NYS-MAIN", 167, 523, 528.23, "", "", "", ""],
          [23, 0, 0, 0, "AAF.AS", 0, null, null, null, null, "AAF.AS", "AAF.AS B.V", "EUR", "XAMS/ENA-MAIN", 410, 867, 875.67, "", "", "", "noop"],
          [24, 0, 0, 0, "AAG.L", 0, null, null, null, null, "AAG.L", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"]
        ]
      });

      state = GridDataReducer(state, {
        type: 'data', offset: 0, rowCount: 1000, rows: [
          [2, 0, 0, 0, "AAA.OQ", 0, null, null, null, null, "AAA.OQ", "AAA.OQ Co.", "EUR", "XNYS/NYS-MAIN", 500, 435, 439.35, "", "", "", "noop"],
          [9, 0, 0, 0, "AAC.N", 0, null, null, null, null, "AAC.N", "AAC.N Corporation", "CAD", "XNGS/NAS-GSM", 1000, 72, 102, "", "", "", "fastTick"],
        ]
      });

      expect(state.buffer[2]).toEqual(
        [2, 2, 0, 0, 'AAA.OQ', 0, null, null, null, null, 'AAA.OQ', 'AAA.OQ Co.', 'EUR', 'XNYS/NYS-MAIN', 500, 435, 439.35, '', '', '', 'noop']
      );
      expect(state.buffer[9]).toEqual(
        [9, 9, 0, 0, 'AAC.N', 0, null, null, null, null, 'AAC.N', 'AAC.N Corporation', 'CAD', 'XNGS/NAS-GSM', 1000, 72, 102, '', '', '', 'fastTick']
      );

    })
    test('mismatched ranges I', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 0, range: { lo: 0, hi: 25 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 0, rowCount: 1000, rows: [
          [0, 0, 0, 0, "AAA.L", 0, null, null, null, null, "AAA.L", "AAA.L London PLC", "USD", "XLON/LSE-SETS", 633, 101, 121, "", "", "", "fastTick"],
          [1, 0, 0, 0, "AAA.N", 0, null, null, null, null, "AAA.N", "AAA.N Corporation", "EUR", "XNGS/NAS-GSM", 220, 914, 943.08, "", "", "", "fastTick"],
          [2, 0, 0, 0, "AAA.OQ", 0, null, null, null, null, "AAA.OQ", "AAA.OQ Co.", "EUR", "XNYS/NYS-MAIN", 393, 435, 439.35, "", "", "", "noop"],
          [3, 0, 0, 0, "AAA.AS", 0, null, null, null, null, "AAA.AS", "AAA.AS B.V", "GBX", "XAMS/ENA-MAIN", 449, 60, 60, "", "", "", "walkBidAsk"],
          [4, 0, 0, 0, "AAB.L", 0, null, null, null, null, "AAB.L", "AAB.L London PLC", "GBX", "XLON/LSE-SETS", 37, 205, 207.05, "", "", "", "noop"],
          [5, 0, 0, 0, "AAB.N", 0, null, null, null, null, "AAB.N", "AAB.N Corporation", "CAD", "XNGS/NAS-GSM", 38, 89, 89, "", "", "", "walkBidAsk"],
          [6, 0, 0, 0, "AAB.OQ", 0, null, null, null, null, "AAB.OQ", "AAB.OQ Co.", "GBX", "XNYS/NYS-MAIN", 286, 246, 248.46, "", "", "", "walkBidAsk"],
          [7, 0, 0, 0, "AAB.AS", 0, null, null, null, null, "AAB.AS", "AAB.AS B.V", "USD", "XAMS/ENA-MAIN", 364, 9, 9.09, "", "", "", "walkBidAsk"],
          [8, 0, 0, 0, "AAC.L", 0, null, null, null, null, "AAC.L", "AAC.L London PLC", "EUR", "XLON/LSE-SETS", 12, 72, 102, "", "", "", "fastTick"],
          [9, 0, 0, 0, "AAC.N", 0, null, null, null, null, "AAC.N", "AAC.N Corporation", "CAD", "XNGS/NAS-GSM", 927, 72, 102, "", "", "", "fastTick"],
          [10, 0, 0, 0, "AAC.OQ", 0, null, null, null, null, "AAC.OQ", "AAC.OQ Co.", "GBX", "XNYS/NYS-MAIN", 559, 704, 711.04, "", "", "", "fastTick"],
          [11, 0, 0, 0, "AAC.AS", 0, null, null, null, null, "AAC.AS", "AAC.AS B.V", "CAD", "XAMS/ENA-MAIN", 946, 655, 661.55, "", "", "", "walkBidAsk"],
          [12, 0, 0, 0, "AAD.L", 0, null, null, null, null, "AAD.L", "AAD.L London PLC", "CAD", "XLON/LSE-SETS", 363, 166, 167.66, "", "", "", ""],
          [13, 0, 0, 0, "AAD.N", 0, null, null, null, null, "AAD.N", "AAD.N Corporation", "CAD", "XNGS/NAS-GSM", 696, 166, 167.66, "", "", "", ""],
          [14, 0, 0, 0, "AAD.OQ", 0, null, null, null, null, "AAD.OQ", "AAD.OQ Co.", "EUR", "XNYS/NYS-MAIN", 806, 13, 13, "", "", "", "walkBidAsk"],
          [15, 0, 0, 0, "AAD.AS", 0, null, null, null, null, "AAD.AS", "AAD.AS B.V", "GBX", "XAMS/ENA-MAIN", 44, 929, 938.29, "", "", "", ""],
          [16, 0, 0, 0, "AAE.L", 0, null, null, null, null, "AAE.L", "AAE.L London PLC", "GBX", "XLON/LSE-SETS", 226, 474, 478.74, "", "", "", "fastTick"],
          [17, 0, 0, 0, "AAE.N", 0, null, null, null, null, "AAE.N", "AAE.N Corporation", "GBX", "XNGS/NAS-GSM", 54, 120, 140, "", "", "", "fastTick"],
          [18, 0, 0, 0, "AAE.OQ", 0, null, null, null, null, "AAE.OQ", "AAE.OQ Co.", "USD", "XNYS/NYS-MAIN", 618, 682, 688.82, "", "", "", "walkBidAsk"],
          [19, 0, 0, 0, "AAE.AS", 0, null, null, null, null, "AAE.AS", "AAE.AS B.V", "CAD", "XAMS/ENA-MAIN", 643, 245, 247.45, "", "", "", "walkBidAsk"],
          [20, 0, 0, 0, "AAF.L", 0, null, null, null, null, "AAF.L", "AAF.L London PLC", "GBX", "XLON/LSE-SETS", 690, 160, 181.23000000000002, "", "", "", "fastTick"],
          [21, 0, 0, 0, "AAF.N", 0, null, null, null, null, "AAF.N", "AAF.N Corporation", "CAD", "XNGS/NAS-GSM", 623, 160, 181.23000000000002, "", "", "", "fastTick"],
          [22, 0, 0, 0, "AAF.OQ", 0, null, null, null, null, "AAF.OQ", "AAF.OQ Co.", "USD", "XNYS/NYS-MAIN", 167, 523, 528.23, "", "", "", ""],
          [23, 0, 0, 0, "AAF.AS", 0, null, null, null, null, "AAF.AS", "AAF.AS B.V", "EUR", "XAMS/ENA-MAIN", 410, 867, 875.67, "", "", "", "noop"],
          [24, 0, 0, 0, "AAG.L", 0, null, null, null, null, "AAG.L", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"]
        ]
      });

      state = GridDataReducer(state, { type: 'range', range: { lo: 31, hi: 56 } });

      state = GridDataReducer(state, {
        type: 'data', offset: 0, rowCount: 1000, rows: [
          [0, 0, 0, 0, "AAA.L", 0, null, null, null, null, "AAA.L", "AAA.L London PLC", "USD", "XLON/LSE-SETS", 633, 101, 121, "", "", "", "fastTick"],
          [1, 0, 0, 0, "AAA.N", 0, null, null, null, null, "AAA.N", "AAA.N Corporation", "EUR", "XNGS/NAS-GSM", 220, 914, 943.08, "", "", "", "fastTick"],
          [2, 0, 0, 0, "AAA.OQ", 0, null, null, null, null, "AAA.OQ", "AAA.OQ Co.", "EUR", "XNYS/NYS-MAIN", 393, 435, 439.35, "", "", "", "noop"],
          [3, 0, 0, 0, "AAA.AS", 0, null, null, null, null, "AAA.AS", "AAA.AS B.V", "GBX", "XAMS/ENA-MAIN", 449, 60, 60, "", "", "", "walkBidAsk"],
          [4, 0, 0, 0, "AAB.L", 0, null, null, null, null, "AAB.L", "AAB.L London PLC", "GBX", "XLON/LSE-SETS", 37, 205, 207.05, "", "", "", "noop"],
          [5, 0, 0, 0, "AAB.N", 0, null, null, null, null, "AAB.N", "AAB.N Corporation", "CAD", "XNGS/NAS-GSM", 38, 89, 89, "", "", "", "walkBidAsk"],
          [6, 0, 0, 0, "AAB.OQ", 0, null, null, null, null, "AAB.OQ", "AAB.OQ Co.", "GBX", "XNYS/NYS-MAIN", 286, 246, 248.46, "", "", "", "walkBidAsk"],
          [7, 0, 0, 0, "AAB.AS", 0, null, null, null, null, "AAB.AS", "AAB.AS B.V", "USD", "XAMS/ENA-MAIN", 364, 9, 9.09, "", "", "", "walkBidAsk"],
          [8, 0, 0, 0, "AAC.L", 0, null, null, null, null, "AAC.L", "AAC.L London PLC", "EUR", "XLON/LSE-SETS", 12, 72, 102, "", "", "", "fastTick"],
          [9, 0, 0, 0, "AAC.N", 0, null, null, null, null, "AAC.N", "AAC.N Corporation", "CAD", "XNGS/NAS-GSM", 927, 72, 102, "", "", "", "fastTick"],
          [10, 0, 0, 0, "AAC.OQ", 0, null, null, null, null, "AAC.OQ", "AAC.OQ Co.", "GBX", "XNYS/NYS-MAIN", 559, 704, 711.04, "", "", "", "fastTick"],
          [11, 0, 0, 0, "AAC.AS", 0, null, null, null, null, "AAC.AS", "AAC.AS B.V", "CAD", "XAMS/ENA-MAIN", 946, 655, 661.55, "", "", "", "walkBidAsk"],
          [12, 0, 0, 0, "AAD.L", 0, null, null, null, null, "AAD.L", "AAD.L London PLC", "CAD", "XLON/LSE-SETS", 363, 166, 167.66, "", "", "", ""],
          [13, 0, 0, 0, "AAD.N", 0, null, null, null, null, "AAD.N", "AAD.N Corporation", "CAD", "XNGS/NAS-GSM", 696, 166, 167.66, "", "", "", ""],
          [14, 0, 0, 0, "AAD.OQ", 0, null, null, null, null, "AAD.OQ", "AAD.OQ Co.", "EUR", "XNYS/NYS-MAIN", 806, 13, 13, "", "", "", "walkBidAsk"],
          [15, 0, 0, 0, "AAD.AS", 0, null, null, null, null, "AAD.AS", "AAD.AS B.V", "GBX", "XAMS/ENA-MAIN", 44, 929, 938.29, "", "", "", ""],
          [16, 0, 0, 0, "AAE.L", 0, null, null, null, null, "AAE.L", "AAE.L London PLC", "GBX", "XLON/LSE-SETS", 226, 474, 478.74, "", "", "", "fastTick"],
          [17, 0, 0, 0, "AAE.N", 0, null, null, null, null, "AAE.N", "AAE.N Corporation", "GBX", "XNGS/NAS-GSM", 54, 120, 140, "", "", "", "fastTick"],
          [18, 0, 0, 0, "AAE.OQ", 0, null, null, null, null, "AAE.OQ", "AAE.OQ Co.", "USD", "XNYS/NYS-MAIN", 618, 682, 688.82, "", "", "", "walkBidAsk"],
          [19, 0, 0, 0, "AAE.AS", 0, null, null, null, null, "AAE.AS", "AAE.AS B.V", "CAD", "XAMS/ENA-MAIN", 643, 245, 247.45, "", "", "", "walkBidAsk"],
          [20, 0, 0, 0, "AAF.L", 0, null, null, null, null, "AAF.L", "AAF.L London PLC", "GBX", "XLON/LSE-SETS", 690, 160, 181.23000000000002, "", "", "", "fastTick"],
          [21, 0, 0, 0, "AAF.N", 0, null, null, null, null, "AAF.N", "AAF.N Corporation", "CAD", "XNGS/NAS-GSM", 623, 160, 181.23000000000002, "", "", "", "fastTick"],
          [22, 0, 0, 0, "AAF.OQ", 0, null, null, null, null, "AAF.OQ", "AAF.OQ Co.", "USD", "XNYS/NYS-MAIN", 167, 523, 528.23, "", "", "", ""],
          [23, 0, 0, 0, "AAF.AS", 0, null, null, null, null, "AAF.AS", "AAF.AS B.V", "EUR", "XAMS/ENA-MAIN", 410, 867, 875.67, "", "", "", "noop"],
          [24, 0, 0, 0, "AAG.L", 0, null, null, null, null, "AAG.L", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [25, 0, 0, 0, "AAG.N", 0, null, null, null, null, "AAG.N", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [26, 0, 0, 0, "AAG.OQ", 0, null, null, null, null, "AAG.OQ", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [27, 0, 0, 0, "AAG.AS", 0, null, null, null, null, "AAG.AS", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [28, 0, 0, 0, "AAH.L", 0, null, null, null, null, "AAH.L", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [29, 0, 0, 0, "AAH.N", 0, null, null, null, null, "AAH.N", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [30, 0, 0, 0, "AAH.OQ", 0, null, null, null, null, "AAH.OQ", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [31, 0, 0, 0, "AAH.AS", 0, null, null, null, null, "AAH.AS", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [32, 0, 0, 0, "AAI.L", 0, null, null, null, null, "AAI.L", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
        ]
      });

      expect(state.buffer.length).toEqual(2);

    });

    test('mismatched ranges II', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 0, range: { lo: 0, hi: 25 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 0, rowCount: 1000, rows: [
          [0, 0, 0, 0, "AAA.L", 0, null, null, null, null, "AAA.L", "AAA.L London PLC", "USD", "XLON/LSE-SETS", 633, 101, 121, "", "", "", "fastTick"],
          [1, 0, 0, 0, "AAA.N", 0, null, null, null, null, "AAA.N", "AAA.N Corporation", "EUR", "XNGS/NAS-GSM", 220, 914, 943.08, "", "", "", "fastTick"],
          [2, 0, 0, 0, "AAA.OQ", 0, null, null, null, null, "AAA.OQ", "AAA.OQ Co.", "EUR", "XNYS/NYS-MAIN", 393, 435, 439.35, "", "", "", "noop"],
          [3, 0, 0, 0, "AAA.AS", 0, null, null, null, null, "AAA.AS", "AAA.AS B.V", "GBX", "XAMS/ENA-MAIN", 449, 60, 60, "", "", "", "walkBidAsk"],
          [4, 0, 0, 0, "AAB.L", 0, null, null, null, null, "AAB.L", "AAB.L London PLC", "GBX", "XLON/LSE-SETS", 37, 205, 207.05, "", "", "", "noop"],
          [5, 0, 0, 0, "AAB.N", 0, null, null, null, null, "AAB.N", "AAB.N Corporation", "CAD", "XNGS/NAS-GSM", 38, 89, 89, "", "", "", "walkBidAsk"],
          [6, 0, 0, 0, "AAB.OQ", 0, null, null, null, null, "AAB.OQ", "AAB.OQ Co.", "GBX", "XNYS/NYS-MAIN", 286, 246, 248.46, "", "", "", "walkBidAsk"],
          [7, 0, 0, 0, "AAB.AS", 0, null, null, null, null, "AAB.AS", "AAB.AS B.V", "USD", "XAMS/ENA-MAIN", 364, 9, 9.09, "", "", "", "walkBidAsk"],
          [8, 0, 0, 0, "AAC.L", 0, null, null, null, null, "AAC.L", "AAC.L London PLC", "EUR", "XLON/LSE-SETS", 12, 72, 102, "", "", "", "fastTick"],
          [9, 0, 0, 0, "AAC.N", 0, null, null, null, null, "AAC.N", "AAC.N Corporation", "CAD", "XNGS/NAS-GSM", 927, 72, 102, "", "", "", "fastTick"],
          [10, 0, 0, 0, "AAC.OQ", 0, null, null, null, null, "AAC.OQ", "AAC.OQ Co.", "GBX", "XNYS/NYS-MAIN", 559, 704, 711.04, "", "", "", "fastTick"],
          [11, 0, 0, 0, "AAC.AS", 0, null, null, null, null, "AAC.AS", "AAC.AS B.V", "CAD", "XAMS/ENA-MAIN", 946, 655, 661.55, "", "", "", "walkBidAsk"],
          [12, 0, 0, 0, "AAD.L", 0, null, null, null, null, "AAD.L", "AAD.L London PLC", "CAD", "XLON/LSE-SETS", 363, 166, 167.66, "", "", "", ""],
          [13, 0, 0, 0, "AAD.N", 0, null, null, null, null, "AAD.N", "AAD.N Corporation", "CAD", "XNGS/NAS-GSM", 696, 166, 167.66, "", "", "", ""],
          [14, 0, 0, 0, "AAD.OQ", 0, null, null, null, null, "AAD.OQ", "AAD.OQ Co.", "EUR", "XNYS/NYS-MAIN", 806, 13, 13, "", "", "", "walkBidAsk"],
          [15, 0, 0, 0, "AAD.AS", 0, null, null, null, null, "AAD.AS", "AAD.AS B.V", "GBX", "XAMS/ENA-MAIN", 44, 929, 938.29, "", "", "", ""],
          [16, 0, 0, 0, "AAE.L", 0, null, null, null, null, "AAE.L", "AAE.L London PLC", "GBX", "XLON/LSE-SETS", 226, 474, 478.74, "", "", "", "fastTick"],
          [17, 0, 0, 0, "AAE.N", 0, null, null, null, null, "AAE.N", "AAE.N Corporation", "GBX", "XNGS/NAS-GSM", 54, 120, 140, "", "", "", "fastTick"],
          [18, 0, 0, 0, "AAE.OQ", 0, null, null, null, null, "AAE.OQ", "AAE.OQ Co.", "USD", "XNYS/NYS-MAIN", 618, 682, 688.82, "", "", "", "walkBidAsk"],
          [19, 0, 0, 0, "AAE.AS", 0, null, null, null, null, "AAE.AS", "AAE.AS B.V", "CAD", "XAMS/ENA-MAIN", 643, 245, 247.45, "", "", "", "walkBidAsk"],
          [20, 0, 0, 0, "AAF.L", 0, null, null, null, null, "AAF.L", "AAF.L London PLC", "GBX", "XLON/LSE-SETS", 690, 160, 181.23000000000002, "", "", "", "fastTick"],
          [21, 0, 0, 0, "AAF.N", 0, null, null, null, null, "AAF.N", "AAF.N Corporation", "CAD", "XNGS/NAS-GSM", 623, 160, 181.23000000000002, "", "", "", "fastTick"],
          [22, 0, 0, 0, "AAF.OQ", 0, null, null, null, null, "AAF.OQ", "AAF.OQ Co.", "USD", "XNYS/NYS-MAIN", 167, 523, 528.23, "", "", "", ""],
          [23, 0, 0, 0, "AAF.AS", 0, null, null, null, null, "AAF.AS", "AAF.AS B.V", "EUR", "XAMS/ENA-MAIN", 410, 867, 875.67, "", "", "", "noop"],
          [24, 0, 0, 0, "AAG.L", 0, null, null, null, null, "AAG.L", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"]
        ]
      });

      state = GridDataReducer(state, { type: 'range', range: { lo: 2, hi: 21 } });

      state = GridDataReducer(state, { type: 'range', range: { lo: 6, hi: 25 } });

      state = GridDataReducer(state, { type: 'range', range: { lo: 11, hi: 30 } });

      state = GridDataReducer(state, {
        type: 'data', offset: 0, rowCount: 1000, rows: [
          [2, 0, 0, 0, "AAA.OQ", 0, null, null, null, null, "AAA.OQ", "AAA.OQ Co.", "EUR", "XNYS/NYS-MAIN", 393, 435, 439.35, "", "", "", "noop"],
          [3, 0, 0, 0, "AAA.AS", 0, null, null, null, null, "AAA.AS", "AAA.AS B.V", "GBX", "XAMS/ENA-MAIN", 449, 60, 60, "", "", "", "walkBidAsk"],
          [4, 0, 0, 0, "AAB.L", 0, null, null, null, null, "AAB.L", "AAB.L London PLC", "GBX", "XLON/LSE-SETS", 37, 205, 207.05, "", "", "", "noop"],
          [5, 0, 0, 0, "AAB.N", 0, null, null, null, null, "AAB.N", "AAB.N Corporation", "CAD", "XNGS/NAS-GSM", 38, 89, 89, "", "", "", "walkBidAsk"],
          [6, 0, 0, 0, "AAB.OQ", 0, null, null, null, null, "AAB.OQ", "AAB.OQ Co.", "GBX", "XNYS/NYS-MAIN", 286, 246, 248.46, "", "", "", "walkBidAsk"],
          [7, 0, 0, 0, "AAB.AS", 0, null, null, null, null, "AAB.AS", "AAB.AS B.V", "USD", "XAMS/ENA-MAIN", 364, 9, 9.09, "", "", "", "walkBidAsk"],
          [8, 0, 0, 0, "AAC.L", 0, null, null, null, null, "AAC.L", "AAC.L London PLC", "EUR", "XLON/LSE-SETS", 12, 72, 102, "", "", "", "fastTick"],
          [9, 0, 0, 0, "AAC.N", 0, null, null, null, null, "AAC.N", "AAC.N Corporation", "CAD", "XNGS/NAS-GSM", 927, 72, 102, "", "", "", "fastTick"],
          [10, 0, 0, 0, "AAC.OQ", 0, null, null, null, null, "AAC.OQ", "AAC.OQ Co.", "GBX", "XNYS/NYS-MAIN", 559, 704, 711.04, "", "", "", "fastTick"],
          [11, 0, 0, 0, "AAC.AS", 0, null, null, null, null, "AAC.AS", "AAC.AS B.V", "CAD", "XAMS/ENA-MAIN", 946, 655, 661.55, "", "", "", "walkBidAsk"],
          [12, 0, 0, 0, "AAD.L", 0, null, null, null, null, "AAD.L", "AAD.L London PLC", "CAD", "XLON/LSE-SETS", 363, 166, 167.66, "", "", "", ""],
          [13, 0, 0, 0, "AAD.N", 0, null, null, null, null, "AAD.N", "AAD.N Corporation", "CAD", "XNGS/NAS-GSM", 696, 166, 167.66, "", "", "", ""],
          [14, 0, 0, 0, "AAD.OQ", 0, null, null, null, null, "AAD.OQ", "AAD.OQ Co.", "EUR", "XNYS/NYS-MAIN", 806, 13, 13, "", "", "", "walkBidAsk"],
          [15, 0, 0, 0, "AAD.AS", 0, null, null, null, null, "AAD.AS", "AAD.AS B.V", "GBX", "XAMS/ENA-MAIN", 44, 929, 938.29, "", "", "", ""],
          [16, 0, 0, 0, "AAE.L", 0, null, null, null, null, "AAE.L", "AAE.L London PLC", "GBX", "XLON/LSE-SETS", 226, 474, 478.74, "", "", "", "fastTick"],
          [17, 0, 0, 0, "AAE.N", 0, null, null, null, null, "AAE.N", "AAE.N Corporation", "GBX", "XNGS/NAS-GSM", 54, 120, 140, "", "", "", "fastTick"],
          [18, 0, 0, 0, "AAE.OQ", 0, null, null, null, null, "AAE.OQ", "AAE.OQ Co.", "USD", "XNYS/NYS-MAIN", 618, 682, 688.82, "", "", "", "walkBidAsk"],
          [19, 0, 0, 0, "AAE.AS", 0, null, null, null, null, "AAE.AS", "AAE.AS B.V", "CAD", "XAMS/ENA-MAIN", 643, 245, 247.45, "", "", "", "walkBidAsk"],
          [20, 0, 0, 0, "AAF.L", 0, null, null, null, null, "AAF.L", "AAF.L London PLC", "GBX", "XLON/LSE-SETS", 690, 160, 181.23000000000002, "", "", "", "fastTick"],
          [21, 0, 0, 0, "AAF.N", 0, null, null, null, null, "AAF.N", "AAF.N Corporation", "CAD", "XNGS/NAS-GSM", 623, 160, 181.23000000000002, "", "", "", "fastTick"],
          [22, 0, 0, 0, "AAF.OQ", 0, null, null, null, null, "AAF.OQ", "AAF.OQ Co.", "USD", "XNYS/NYS-MAIN", 167, 523, 528.23, "", "", "", ""],
          [23, 0, 0, 0, "AAF.AS", 0, null, null, null, null, "AAF.AS", "AAF.AS B.V", "EUR", "XAMS/ENA-MAIN", 410, 867, 875.67, "", "", "", "noop"],
          [24, 0, 0, 0, "AAG.L", 0, null, null, null, null, "AAG.L", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [25, 0, 0, 0, "AAG.N", 0, null, null, null, null, "AAG.N", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [26, 0, 0, 0, "AAG.OQ", 0, null, null, null, null, "AAG.OQ", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [27, 0, 0, 0, "AAG.AS", 0, null, null, null, null, "AAG.AS", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [28, 0, 0, 0, "AAH.L", 0, null, null, null, null, "AAH.L", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
          [29, 0, 0, 0, "AAH.N", 0, null, null, null, null, "AAH.N", "AAG.L London PLC", "EUR", "XLON/LSE-SETS", 928, 690, 696.9, "", "", "", "walkBidAsk"],
        ]
      });

      expect(state.buffer.length).toEqual(19);

    })
  })

  describe('VUU Scrolling', () => {

    test('Scrolling FWD from top, then BWD, many scolls before data response', () => {
      let state = GridDataReducer(undefined, { type: 'clear', size: 1000, bufferSize: 10, range: { lo: 0, hi: 25 } });
      state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
        [0,0,0,0,"AAA.L",0,null,null,null,null,"AAA.L","AAA.L London PLC","USD","XLON/LSE-SETS",633],
        [1,0,0,0,"AAA.N",0,null,null,null,null,"AAA.N","AAA.N Corporation","EUR","XNGS/NAS-GSM",220],
        [2,0,0,0,"AAA.OQ",0,null,null,null,null,"AAA.OQ","AAA.OQ Co.","EUR","XNYS/NYS-MAIN",393],
        [3,0,0,0,"AAA.AS",0,null,null,null,null,"AAA.AS","AAA.AS B.V","GBX","XAMS/ENA-MAIN",449],
        [4,0,0,0,"AAB.L",0,null,null,null,null,"AAB.L","AAB.L London PLC","GBX","XLON/LSE-SETS",37],
        [5,0,0,0,"AAB.N",0,null,null,null,null,"AAB.N","AAB.N Corporation","CAD","XNGS/NAS-GSM",38],
        [6,0,0,0,"AAB.OQ",0,null,null,null,null,"AAB.OQ","AAB.OQ Co.","GBX","XNYS/NYS-MAIN",286],
        [7,0,0,0,"AAB.AS",0,null,null,null,null,"AAB.AS","AAB.AS B.V","USD","XAMS/ENA-MAIN",364],
        [8,0,0,0,"AAC.L",0,null,null,null,null,"AAC.L","AAC.L London PLC","EUR","XLON/LSE-SETS",12],[9,0,0,0,"AAC.N",0,null,null,null,null,"AAC.N","AAC.N Corporation","CAD","XNGS/NAS-GSM",927],[10,0,0,0,"AAC.OQ",0,null,null,null,null,"AAC.OQ","AAC.OQ Co.","GBX","XNYS/NYS-MAIN",559],[11,0,0,0,"AAC.AS",0,null,null,null,null,"AAC.AS","AAC.AS B.V","CAD","XAMS/ENA-MAIN",946],[12,0,0,0,"AAD.L",0,null,null,null,null,"AAD.L","AAD.L London PLC","CAD","XLON/LSE-SETS",363],[13,0,0,0,"AAD.N",0,null,null,null,null,"AAD.N","AAD.N Corporation","CAD","XNGS/NAS-GSM",696],[14,0,0,0,"AAD.OQ",0,null,null,null,null,"AAD.OQ","AAD.OQ Co.","EUR","XNYS/NYS-MAIN",806],[15,0,0,0,"AAD.AS",0,null,null,null,null,"AAD.AS","AAD.AS B.V","GBX","XAMS/ENA-MAIN",44],[16,0,0,0,"AAE.L",0,null,null,null,null,"AAE.L","AAE.L London PLC","GBX","XLON/LSE-SETS",226],[17,0,0,0,"AAE.N",0,null,null,null,null,"AAE.N","AAE.N Corporation","GBX","XNGS/NAS-GSM",54],[18,0,0,0,"AAE.OQ",0,null,null,null,null,"AAE.OQ","AAE.OQ Co.","USD","XNYS/NYS-MAIN",618],[19,0,0,0,"AAE.AS",0,null,null,null,null,"AAE.AS","AAE.AS B.V","CAD","XAMS/ENA-MAIN",643],[20,0,0,0,"AAF.L",0,null,null,null,null,"AAF.L","AAF.L London PLC","GBX","XLON/LSE-SETS",690],[21,0,0,0,"AAF.N",0,null,null,null,null,"AAF.N","AAF.N Corporation","CAD","XNGS/NAS-GSM",623],
        [22,0,0,0,"AAF.OQ",0,null,null,null,null,"AAF.OQ","AAF.OQ Co.","USD","XNYS/NYS-MAIN",167],
        [23,0,0,0,"AAF.AS",0,null,null,null,null,"AAF.AS","AAF.AS B.V","EUR","XAMS/ENA-MAIN",410],
        [24,0,0,0,"AAG.L",0,null,null,null,null,"AAG.L","AAG.L London PLC","EUR","XLON/LSE-SETS",928]      
      ] });
      state = GridDataReducer(state, { type: 'range', range: { lo:6, hi: 31 } });     // server request 0:41
      state = GridDataReducer(state, { type: 'range', range: { lo:13, hi: 38 } });    // server request 3:48
      state = GridDataReducer(state, { type: 'range', range: { lo: 18, hi: 43 } });   // server erquest 8:53
      state = GridDataReducer(state, { type: 'range', range: { lo: 28, hi: 53 } });   // server request 18:63
      state = GridDataReducer(state, { type: 'range', range: { lo: 37, hi: 62 } });   // server request 27:72
      state = GridDataReducer(state, { type: 'range', range: { lo: 45, hi: 70 } });   // server request 35:80
      state = GridDataReducer(state, { type: 'range', range: { lo: 53, hi: 78 } });   // server erquest 43:88
      state = GridDataReducer(state, { type: 'range', range: { lo:60, hi: 85 } });    // server request 50:95
      state = GridDataReducer(state, { type: 'range', range: { lo:66, hi: 91 } });    // server request 56:101
      state = GridDataReducer(state, { type: 'range', range: { lo:72, hi: 97 } });    // server request 62:108
      state = GridDataReducer(state, { type: 'range', range: { lo: 76, hi: 101 } });  // server request 66:111

      // This set of rows is already out of range so will be ignored
      state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
        [18,0,0,0,"AAE.OQ",0,null,null,null,null,"AAE.OQ","AAE.OQ Co.","USD","XNYS/NYS-MAIN",618],
        [19,0,0,0,"AAE.AS",0,null,null,null,null,"AAE.AS","AAE.AS B.V","CAD","XAMS/ENA-MAIN",643],
        [20,0,0,0,"AAF.L",0,null,null,null,null,"AAF.L","AAF.L London PLC","GBX","XLON/LSE-SETS",690],
        [21,0,0,0,"AAF.N",0,null,null,null,null,"AAF.N","AAF.N Corporation","CAD","XNGS/NAS-GSM",623],
        [22,0,0,0,"AAF.OQ",0,null,null,null,null,"AAF.OQ","AAF.OQ Co.","USD","XNYS/NYS-MAIN",167],
        [23,0,0,0,"AAF.AS",0,null,null,null,null,"AAF.AS","AAF.AS B.V","EUR","XAMS/ENA-MAIN",410],
        [24,0,0,0,"AAG.L",0,null,null,null,null,"AAG.L","AAG.L London PLC","EUR","XLON/LSE-SETS",928],
        [25,0,0,0,"AAG.N",0,null,null,null,null,"AAG.N","AAG.N Corporation","GBX","XNGS/NAS-GSM",900],
        [26,0,0,0,"AAG.OQ",0,null,null,null,null,"AAG.OQ","AAG.OQ Co.","CAD","XNYS/NYS-MAIN",896],
        [27,0,0,0,"AAG.AS",0,null,null,null,null,"AAG.AS","AAG.AS B.V","USD","XAMS/ENA-MAIN",934],
        [28,0,0,0,"AAH.L",0,null,null,null,null,"AAH.L","AAH.L London PLC","USD","XLON/LSE-SETS",553],
        [29,0,0,0,"AAH.N",0,null,null,null,null,"AAH.N","AAH.N Corporation","EUR","XNGS/NAS-GSM",879],
        [30,0,0,0,"AAH.OQ",0,null,null,null,null,"AAH.OQ","AAH.OQ Co.","GBX","XNYS/NYS-MAIN",943],
        [31,0,0,0,"AAH.AS",0,null,null,null,null,"AAH.AS","AAH.AS B.V","GBX","XAMS/ENA-MAIN",303],
        [32,0,0,0,"AAI.L",0,null,null,null,null,"AAI.L","AAI.L London PLC","CAD","XLON/LSE-SETS",430],[33,0,0,0,"AAI.N",0,null,null,null,null,"AAI.N","AAI.N Corporation","EUR","XNGS/NAS-GSM",628],[34,0,0,0,"AAI.OQ",0,null,null,null,null,"AAI.OQ","AAI.OQ Co.","CAD","XNYS/NYS-MAIN",720],[35,0,0,0,"AAI.AS",0,null,null,null,null,"AAI.AS","AAI.AS B.V","EUR","XAMS/ENA-MAIN",478],
        [36,0,0,0,"AAJ.L",0,null,null,null,null,"AAJ.L","AAJ.L London PLC","CAD","XLON/LSE-SETS",759],[37,0,0,0,"AAJ.N",0,null,null,null,null,"AAJ.N","AAJ.N Corporation","GBX","XNGS/NAS-GSM",697],[38,0,0,0,"AAJ.OQ",0,null,null,null,null,"AAJ.OQ","AAJ.OQ Co.","EUR","XNYS/NYS-MAIN",68],[39,0,0,0,"AAJ.AS",0,null,null,null,null,"AAJ.AS","AAJ.AS B.V","GBX","XAMS/ENA-MAIN",199],[40,0,0,0,"AAK.L",0,null,null,null,null,"AAK.L","AAK.L London PLC","USD","XLON/LSE-SETS",873],[41,0,0,0,"AAK.N",0,null,null,null,null,"AAK.N","AAK.N Corporation","EUR","XNGS/NAS-GSM",951],
        [42,0,0,0,"AAK.OQ",0,null,null,null,null,"AAK.OQ","AAK.OQ Co.","EUR","XNYS/NYS-MAIN",793],
        [43,0,0,0,"AAK.AS",0,null,null,null,null,"AAK.AS","AAK.AS B.V","USD","XAMS/ENA-MAIN",382],[44,0,0,0,"AAL.L",0,null,null,null,null,"AAL.L","AAL.L London PLC","GBX","XLON/LSE-SETS",578],[45,0,0,0,"AAL.N",0,null,null,null,null,"AAL.N","AAL.N Corporation","CAD","XNGS/NAS-GSM",328],[46,0,0,0,"AAL.OQ",0,null,null,null,null,"AAL.OQ","AAL.OQ Co.","EUR","XNYS/NYS-MAIN",76],[47,0,0,0,"AAL.AS",0,null,null,null,null,"AAL.AS","AAL.AS B.V","CAD","XAMS/ENA-MAIN",691],[48,0,0,0,"AAM.L",0,null,null,null,null,"AAM.L","AAM.L London PLC","GBX","XLON/LSE-SETS",161],[49,0,0,0,"AAM.N",0,null,null,null,null,"AAM.N","AAM.N Corporation","CAD","XNGS/NAS-GSM",57],
        [50,0,0,0,"AAM.OQ",0,null,null,null,null,"AAM.OQ","AAM.OQ Co.","CAD","XNYS/NYS-MAIN",201],
        [51,0,0,0,"AAM.AS",0,null,null,null,null,"AAM.AS","AAM.AS B.V","USD","XAMS/ENA-MAIN",432],
        [52,0,0,0,"AAN.L",0,null,null,null,null,"AAN.L","AAN.L London PLC","USD","XLON/LSE-SETS",80],[53,0,0,0,"AAN.N",0,null,null,null,null,"AAN.N","AAN.N Corporation","CAD","XNGS/NAS-GSM",903],[54,0,0,0,"AAN.OQ",0,null,null,null,null,"AAN.OQ","AAN.OQ Co.","EUR","XNYS/NYS-MAIN",206],[55,0,0,0,"AAN.AS",0,null,null,null,null,"AAN.AS","AAN.AS B.V","USD","XAMS/ENA-MAIN",911],[56,0,0,0,"AAO.L",0,null,null,null,null,"AAO.L","AAO.L London PLC","CAD","XLON/LSE-SETS",356],[57,0,0,0,"AAO.N",0,null,null,null,null,"AAO.N","AAO.N Corporation","EUR","XNGS/NAS-GSM",211],[58,0,0,0,"AAO.OQ",0,null,null,null,null,"AAO.OQ","AAO.OQ Co.","CAD","XNYS/NYS-MAIN",310],[59,0,0,0,"AAO.AS",0,null,null,null,null,"AAO.AS","AAO.AS B.V","USD","XAMS/ENA-MAIN",654],
        [60,0,0,0,"AAP.L",0,null,null,null,null,"AAP.L","AAP.L London PLC","USD","XLON/LSE-SETS",169],
        [61,0,0,0,"AAP.N",0,null,null,null,null,"AAP.N","AAP.N Corporation","USD","XNGS/NAS-GSM",408],
        [62,0,0,0,"AAP.OQ",0,null,null,null,null,"AAP.OQ","AAP.OQ Co.","GBX","XNYS/NYS-MAIN",706]
      ]});
      state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
        [50,0,0,0,"AAM.OQ",0,null,null,null,null,"AAM.OQ","AAM.OQ Co.","CAD","XNYS/NYS-MAIN",201],
        [51,0,0,0,"AAM.AS",0,null,null,null,null,"AAM.AS","AAM.AS B.V","USD","XAMS/ENA-MAIN",432],
        [52,0,0,0,"AAN.L",0,null,null,null,null,"AAN.L","AAN.L London PLC","USD","XLON/LSE-SETS",80],
        [53,0,0,0,"AAN.N",0,null,null,null,null,"AAN.N","AAN.N Corporation","CAD","XNGS/NAS-GSM",903],
        [54,0,0,0,"AAN.OQ",0,null,null,null,null,"AAN.OQ","AAN.OQ Co.","EUR","XNYS/NYS-MAIN",206],
        [55,0,0,0,"AAN.AS",0,null,null,null,null,"AAN.AS","AAN.AS B.V","USD","XAMS/ENA-MAIN",911],
        [56,0,0,0,"AAO.L",0,null,null,null,null,"AAO.L","AAO.L London PLC","CAD","XLON/LSE-SETS",356],
        [57,0,0,0,"AAO.N",0,null,null,null,null,"AAO.N","AAO.N Corporation","EUR","XNGS/NAS-GSM",211],
        [58,0,0,0,"AAO.OQ",0,null,null,null,null,"AAO.OQ","AAO.OQ Co.","CAD","XNYS/NYS-MAIN",310],
        [59,0,0,0,"AAO.AS",0,null,null,null,null,"AAO.AS","AAO.AS B.V","USD","XAMS/ENA-MAIN",654],
        [60,0,0,0,"AAP.L",0,null,null,null,null,"AAP.L","AAP.L London PLC","USD","XLON/LSE-SETS",169],
        [61,0,0,0,"AAP.N",0,null,null,null,null,"AAP.N","AAP.N Corporation","USD","XNGS/NAS-GSM",408],
        [62,0,0,0,"AAP.OQ",0,null,null,null,null,"AAP.OQ","AAP.OQ Co.","GBX","XNYS/NYS-MAIN",706],
        [63,0,0,0,"AAP.AS",0,null,null,null,null,"AAP.AS","AAP.AS B.V","USD","XAMS/ENA-MAIN",892],
        [64,0,0,0,"AAQ.L",0,null,null,null,null,"AAQ.L","AAQ.L London PLC","EUR","XLON/LSE-SETS",568],
        [65,0,0,0,"AAQ.N",0,null,null,null,null,"AAQ.N","AAQ.N Corporation","EUR","XNGS/NAS-GSM",313],
        // The following are in range (including buffer). We only have part of the current viewport,
        // so we won't render it
        [66,0,0,0,"AAQ.OQ",0,null,null,null,null,"AAQ.OQ","AAQ.OQ Co.","USD","XNYS/NYS-MAIN",607],
        [67,0,0,0,"AAQ.AS",0,null,null,null,null,"AAQ.AS","AAQ.AS B.V","CAD","XAMS/ENA-MAIN",451],
        [68,0,0,0,"AAR.L",0,null,null,null,null,"AAR.L","AAR.L London PLC","GBX","XLON/LSE-SETS",346],
        [69,0,0,0,"AAR.N",0,null,null,null,null,"AAR.N","AAR.N Corporation","GBX","XNGS/NAS-GSM",717],
        [70,0,0,0,"AAR.OQ",0,null,null,null,null,"AAR.OQ","AAR.OQ Co.","CAD","XNYS/NYS-MAIN",404],
        [71,0,0,0,"AAR.AS",0,null,null,null,null,"AAR.AS","AAR.AS B.V","GBX","XAMS/ENA-MAIN",606],
        [72,0,0,0,"AAS.L",0,null,null,null,null,"AAS.L","AAS.L London PLC","USD","XLON/LSE-SETS",19],
        [73,0,0,0,"AAS.N",0,null,null,null,null,"AAS.N","AAS.N Corporation","GBX","XNGS/NAS-GSM",429],
        [74,0,0,0,"AAS.OQ",0,null,null,null,null,"AAS.OQ","AAS.OQ Co.","EUR","XNYS/NYS-MAIN",170],
        [75,0,0,0,"AAS.AS",0,null,null,null,null,"AAS.AS","AAS.AS B.V","GBX","XAMS/ENA-MAIN",234],
        [76,0,0,0,"AAT.L",0,null,null,null,null,"AAT.L","AAT.L London PLC","CAD","XLON/LSE-SETS",202],[77,0,0,0,"AAT.N",0,null,null,null,null,"AAT.N","AAT.N Corporation","USD","XNGS/NAS-GSM",426],[78,0,0,0,"AAT.OQ",0,null,null,null,null,"AAT.OQ","AAT.OQ Co.","EUR","XNYS/NYS-MAIN",444],[79,0,0,0,"AAT.AS",0,null,null,null,null,"AAT.AS","AAT.AS B.V","CAD","XAMS/ENA-MAIN",134],[80,0,0,0,"AAU.L",0,null,null,null,null,"AAU.L","AAU.L London PLC","GBX","XLON/LSE-SETS",517],[81,0,0,0,"AAU.N",0,null,null,null,null,"AAU.N","AAU.N Corporation","GBX","XNGS/NAS-GSM",169],[82,0,0,0,"AAU.OQ",0,null,null,null,null,"AAU.OQ","AAU.OQ Co.","EUR","XNYS/NYS-MAIN",750],[83,0,0,0,"AAU.AS",0,null,null,null,null,"AAU.AS","AAU.AS B.V","USD","XAMS/ENA-MAIN",676],[84,0,0,0,"AAV.L",0,null,null,null,null,"AAV.L","AAV.L London PLC","CAD","XLON/LSE-SETS",823],[85,0,0,0,"AAV.N",0,null,null,null,null,"AAV.N","AAV.N Corporation","EUR","XNGS/NAS-GSM",768],[86,0,0,0,"AAV.OQ",0,null,null,null,null,"AAV.OQ","AAV.OQ Co.","EUR","XNYS/NYS-MAIN",856],[87,0,0,0,"AAV.AS",0,null,null,null,null,"AAV.AS","AAV.AS B.V","GBX","XAMS/ENA-MAIN",120],[88,0,0,0,"AAW.L",0,null,null,null,null,"AAW.L","AAW.L London PLC","USD","XLON/LSE-SETS",900],[89,0,0,0,"AAW.N",0,null,null,null,null,"AAW.N","AAW.N Corporation","CAD","XNGS/NAS-GSM",48],[90,0,0,0,"AAW.OQ",0,null,null,null,null,"AAW.OQ","AAW.OQ Co.","USD","XNYS/NYS-MAIN",818],[91,0,0,0,"AAW.AS",0,null,null,null,null,"AAW.AS","AAW.AS B.V","USD","XAMS/ENA-MAIN",581],
        [92,0,0,0,"AAX.L",0,null,null,null,null,"AAX.L","AAX.L London PLC","GBX","XLON/LSE-SETS",761],
        [93,0,0,0,"AAX.N",0,null,null,null,null,"AAX.N","AAX.N Corporation","CAD","XNGS/NAS-GSM",435],
        [94,0,0,0,"AAX.OQ",0,null,null,null,null,"AAX.OQ","AAX.OQ Co.","EUR","XNYS/NYS-MAIN",407]
      ]});

      expect(state.dataRequired).toEqual(true);

      state = GridDataReducer(state, { type: 'range', range: { lo: 80, hi: 105 } });    // server request 70:115
      state = GridDataReducer(state, { type: 'range', range: { lo: 87, hi: 112 } });    // server request 77:122

      state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
        [66,0,0,0,"AAQ.OQ",0,null,null,null,null,"AAQ.OQ","AAQ.OQ Co.","USD","XNYS/NYS-MAIN",607],
        [67,0,0,0,"AAQ.AS",0,null,null,null,null,"AAQ.AS","AAQ.AS B.V","CAD","XAMS/ENA-MAIN",451],
        [68,0,0,0,"AAR.L",0,null,null,null,null,"AAR.L","AAR.L London PLC","GBX","XLON/LSE-SETS",346],
        [69,0,0,0,"AAR.N",0,null,null,null,null,"AAR.N","AAR.N Corporation","GBX","XNGS/NAS-GSM",717],
        [70,0,0,0,"AAR.OQ",0,null,null,null,null,"AAR.OQ","AAR.OQ Co.","CAD","XNYS/NYS-MAIN",404],
        [71,0,0,0,"AAR.AS",0,null,null,null,null,"AAR.AS","AAR.AS B.V","GBX","XAMS/ENA-MAIN",606],
        [72,0,0,0,"AAS.L",0,null,null,null,null,"AAS.L","AAS.L London PLC","USD","XLON/LSE-SETS",19],
        [73,0,0,0,"AAS.N",0,null,null,null,null,"AAS.N","AAS.N Corporation","GBX","XNGS/NAS-GSM",429],[74,0,0,0,"AAS.OQ",0,null,null,null,null,"AAS.OQ","AAS.OQ Co.","EUR","XNYS/NYS-MAIN",170],[75,0,0,0,"AAS.AS",0,null,null,null,null,"AAS.AS","AAS.AS B.V","GBX","XAMS/ENA-MAIN",234],[76,0,0,0,"AAT.L",0,null,null,null,null,"AAT.L","AAT.L London PLC","CAD","XLON/LSE-SETS",202],[77,0,0,0,"AAT.N",0,null,null,null,null,"AAT.N","AAT.N Corporation","USD","XNGS/NAS-GSM",426],[78,0,0,0,"AAT.OQ",0,null,null,null,null,"AAT.OQ","AAT.OQ Co.","EUR","XNYS/NYS-MAIN",444],[79,0,0,0,"AAT.AS",0,null,null,null,null,"AAT.AS","AAT.AS B.V","CAD","XAMS/ENA-MAIN",134],[80,0,0,0,"AAU.L",0,null,null,null,null,"AAU.L","AAU.L London PLC","GBX","XLON/LSE-SETS",517],[81,0,0,0,"AAU.N",0,null,null,null,null,"AAU.N","AAU.N Corporation","GBX","XNGS/NAS-GSM",169],[82,0,0,0,"AAU.OQ",0,null,null,null,null,"AAU.OQ","AAU.OQ Co.","EUR","XNYS/NYS-MAIN",750],[83,0,0,0,"AAU.AS",0,null,null,null,null,"AAU.AS","AAU.AS B.V","USD","XAMS/ENA-MAIN",676],[84,0,0,0,"AAV.L",0,null,null,null,null,"AAV.L","AAV.L London PLC","CAD","XLON/LSE-SETS",823],[85,0,0,0,"AAV.N",0,null,null,null,null,"AAV.N","AAV.N Corporation","EUR","XNGS/NAS-GSM",768],[86,0,0,0,"AAV.OQ",0,null,null,null,null,"AAV.OQ","AAV.OQ Co.","EUR","XNYS/NYS-MAIN",856],[87,0,0,0,"AAV.AS",0,null,null,null,null,"AAV.AS","AAV.AS B.V","GBX","XAMS/ENA-MAIN",120],[88,0,0,0,"AAW.L",0,null,null,null,null,"AAW.L","AAW.L London PLC","USD","XLON/LSE-SETS",900],[89,0,0,0,"AAW.N",0,null,null,null,null,"AAW.N","AAW.N Corporation","CAD","XNGS/NAS-GSM",48],[90,0,0,0,"AAW.OQ",0,null,null,null,null,"AAW.OQ","AAW.OQ Co.","USD","XNYS/NYS-MAIN",818],[91,0,0,0,"AAW.AS",0,null,null,null,null,"AAW.AS","AAW.AS B.V","USD","XAMS/ENA-MAIN",581],[92,0,0,0,"AAX.L",0,null,null,null,null,"AAX.L","AAX.L London PLC","GBX","XLON/LSE-SETS",761],[93,0,0,0,"AAX.N",0,null,null,null,null,"AAX.N","AAX.N Corporation","CAD","XNGS/NAS-GSM",435],[94,0,0,0,"AAX.OQ",0,null,null,null,null,"AAX.OQ","AAX.OQ Co.","EUR","XNYS/NYS-MAIN",407],[95,0,0,0,"AAX.AS",0,null,null,null,null,"AAX.AS","AAX.AS B.V","GBX","XAMS/ENA-MAIN",269],[96,0,0,0,"AAY.L",0,null,null,null,null,"AAY.L","AAY.L London PLC","EUR","XLON/LSE-SETS",774],[97,0,0,0,"AAY.N",0,null,null,null,null,"AAY.N","AAY.N Corporation","USD","XNGS/NAS-GSM",44],[98,0,0,0,"AAY.OQ",0,null,null,null,null,"AAY.OQ","AAY.OQ Co.","EUR","XNYS/NYS-MAIN",828],[99,0,0,0,"AAY.AS",0,null,null,null,null,"AAY.AS","AAY.AS B.V","EUR","XAMS/ENA-MAIN",767],[100,0,0,0,"AAZ.L",0,null,null,null,null,"AAZ.L","AAZ.L London PLC","EUR","XLON/LSE-SETS",637],[101,0,0,0,"AAZ.N",0,null,null,null,null,"AAZ.N","AAZ.N Corporation","GBX","XNGS/NAS-GSM",44],[102,0,0,0,"AAZ.OQ",0,null,null,null,null,"AAZ.OQ","AAZ.OQ Co.","USD","XNYS/NYS-MAIN",647],[103,0,0,0,"AAZ.AS",0,null,null,null,null,"AAZ.AS","AAZ.AS B.V","USD","XAMS/ENA-MAIN",312],[104,0,0,0,"ABA.L",0,null,null,null,null,"ABA.L","ABA.L London PLC","GBX","XLON/LSE-SETS",914],[105,0,0,0,"ABA.N",0,null,null,null,null,"ABA.N","ABA.N Corporation","CAD","XNGS/NAS-GSM",568],[106,0,0,0,"ABA.OQ",0,null,null,null,null,"ABA.OQ","ABA.OQ Co.","EUR","XNYS/NYS-MAIN",66],[107,0,0,0,"ABA.AS",0,null,null,null,null,"ABA.AS","ABA.AS B.V","CAD","XAMS/ENA-MAIN",325],
        [108,0,0,0,"ABB.L",0,null,null,null,null,"ABB.L","ABB.L London PLC","EUR","XLON/LSE-SETS",322],
        [109,0,0,0,"ABB.N",0,null,null,null,null,"ABB.N","ABB.N Corporation","USD","XNGS/NAS-GSM",126],
        [110,0,0,0,"ABB.OQ",0,null,null,null,null,"ABB.OQ","ABB.OQ Co.","GBX","XNYS/NYS-MAIN",351]
      ]});

        state = GridDataReducer(state, { type: 'range', range: { lo: 89, hi: 114 } });
        state = GridDataReducer(state, { type: 'range', range: { lo: 91, hi: 116 } });
        state = GridDataReducer(state, { type: 'range', range: { lo: 92, hi: 117 } });

        state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
          [70,0,0,0,"AAR.OQ",0,null,null,null,null,"AAR.OQ","AAR.OQ Co.","CAD","XNYS/NYS-MAIN",404],[71,0,0,0,"AAR.AS",0,null,null,null,null,"AAR.AS","AAR.AS B.V","GBX","XAMS/ENA-MAIN",606],[72,0,0,0,"AAS.L",0,null,null,null,null,"AAS.L","AAS.L London PLC","USD","XLON/LSE-SETS",19],[73,0,0,0,"AAS.N",0,null,null,null,null,"AAS.N","AAS.N Corporation","GBX","XNGS/NAS-GSM",429],[74,0,0,0,"AAS.OQ",0,null,null,null,null,"AAS.OQ","AAS.OQ Co.","EUR","XNYS/NYS-MAIN",170],[75,0,0,0,"AAS.AS",0,null,null,null,null,"AAS.AS","AAS.AS B.V","GBX","XAMS/ENA-MAIN",234],[76,0,0,0,"AAT.L",0,null,null,null,null,"AAT.L","AAT.L London PLC","CAD","XLON/LSE-SETS",202],[77,0,0,0,"AAT.N",0,null,null,null,null,"AAT.N","AAT.N Corporation","USD","XNGS/NAS-GSM",426],[78,0,0,0,"AAT.OQ",0,null,null,null,null,"AAT.OQ","AAT.OQ Co.","EUR","XNYS/NYS-MAIN",444],[79,0,0,0,"AAT.AS",0,null,null,null,null,"AAT.AS","AAT.AS B.V","CAD","XAMS/ENA-MAIN",134],[80,0,0,0,"AAU.L",0,null,null,null,null,"AAU.L","AAU.L London PLC","GBX","XLON/LSE-SETS",517],[81,0,0,0,"AAU.N",0,null,null,null,null,"AAU.N","AAU.N Corporation","GBX","XNGS/NAS-GSM",169],[82,0,0,0,"AAU.OQ",0,null,null,null,null,"AAU.OQ","AAU.OQ Co.","EUR","XNYS/NYS-MAIN",750],[83,0,0,0,"AAU.AS",0,null,null,null,null,"AAU.AS","AAU.AS B.V","USD","XAMS/ENA-MAIN",676],[84,0,0,0,"AAV.L",0,null,null,null,null,"AAV.L","AAV.L London PLC","CAD","XLON/LSE-SETS",823],[85,0,0,0,"AAV.N",0,null,null,null,null,"AAV.N","AAV.N Corporation","EUR","XNGS/NAS-GSM",768],[86,0,0,0,"AAV.OQ",0,null,null,null,null,"AAV.OQ","AAV.OQ Co.","EUR","XNYS/NYS-MAIN",856],[87,0,0,0,"AAV.AS",0,null,null,null,null,"AAV.AS","AAV.AS B.V","GBX","XAMS/ENA-MAIN",120],[88,0,0,0,"AAW.L",0,null,null,null,null,"AAW.L","AAW.L London PLC","USD","XLON/LSE-SETS",900],[89,0,0,0,"AAW.N",0,null,null,null,null,"AAW.N","AAW.N Corporation","CAD","XNGS/NAS-GSM",48],[90,0,0,0,"AAW.OQ",0,null,null,null,null,"AAW.OQ","AAW.OQ Co.","USD","XNYS/NYS-MAIN",818],[91,0,0,0,"AAW.AS",0,null,null,null,null,"AAW.AS","AAW.AS B.V","USD","XAMS/ENA-MAIN",581],[92,0,0,0,"AAX.L",0,null,null,null,null,"AAX.L","AAX.L London PLC","GBX","XLON/LSE-SETS",761],[93,0,0,0,"AAX.N",0,null,null,null,null,"AAX.N","AAX.N Corporation","CAD","XNGS/NAS-GSM",435],[94,0,0,0,"AAX.OQ",0,null,null,null,null,"AAX.OQ","AAX.OQ Co.","EUR","XNYS/NYS-MAIN",407],[95,0,0,0,"AAX.AS",0,null,null,null,null,"AAX.AS","AAX.AS B.V","GBX","XAMS/ENA-MAIN",269],[96,0,0,0,"AAY.L",0,null,null,null,null,"AAY.L","AAY.L London PLC","EUR","XLON/LSE-SETS",774],[97,0,0,0,"AAY.N",0,null,null,null,null,"AAY.N","AAY.N Corporation","USD","XNGS/NAS-GSM",44],[98,0,0,0,"AAY.OQ",0,null,null,null,null,"AAY.OQ","AAY.OQ Co.","EUR","XNYS/NYS-MAIN",828],[99,0,0,0,"AAY.AS",0,null,null,null,null,"AAY.AS","AAY.AS B.V","EUR","XAMS/ENA-MAIN",767],[100,0,0,0,"AAZ.L",0,null,null,null,null,"AAZ.L","AAZ.L London PLC","EUR","XLON/LSE-SETS",637],[101,0,0,0,"AAZ.N",0,null,null,null,null,"AAZ.N","AAZ.N Corporation","GBX","XNGS/NAS-GSM",44],[102,0,0,0,"AAZ.OQ",0,null,null,null,null,"AAZ.OQ","AAZ.OQ Co.","USD","XNYS/NYS-MAIN",647],[103,0,0,0,"AAZ.AS",0,null,null,null,null,"AAZ.AS","AAZ.AS B.V","USD","XAMS/ENA-MAIN",312],[104,0,0,0,"ABA.L",0,null,null,null,null,"ABA.L","ABA.L London PLC","GBX","XLON/LSE-SETS",914],[105,0,0,0,"ABA.N",0,null,null,null,null,"ABA.N","ABA.N Corporation","CAD","XNGS/NAS-GSM",568],[106,0,0,0,"ABA.OQ",0,null,null,null,null,"ABA.OQ","ABA.OQ Co.","EUR","XNYS/NYS-MAIN",66],[107,0,0,0,"ABA.AS",0,null,null,null,null,"ABA.AS","ABA.AS B.V","CAD","XAMS/ENA-MAIN",325],[108,0,0,0,"ABB.L",0,null,null,null,null,"ABB.L","ABB.L London PLC","EUR","XLON/LSE-SETS",322],[109,0,0,0,"ABB.N",0,null,null,null,null,"ABB.N","ABB.N Corporation","USD","XNGS/NAS-GSM",126],[110,0,0,0,"ABB.OQ",0,null,null,null,null,"ABB.OQ","ABB.OQ Co.","GBX","XNYS/NYS-MAIN",351],[111,0,0,0,"ABB.AS",0,null,null,null,null,"ABB.AS","ABB.AS B.V","CAD","XAMS/ENA-MAIN",524],[112,0,0,0,"ABC.L",0,null,null,null,null,"ABC.L","ABC.L London PLC","EUR","XLON/LSE-SETS",686],[113,0,0,0,"ABC.N",0,null,null,null,null,"ABC.N","ABC.N Corporation","CAD","XNGS/NAS-GSM",751],
          [114,0,0,0,"ABC.OQ",0,null,null,null,null,"ABC.OQ","ABC.OQ Co.","CAD","XNYS/NYS-MAIN",283]
        ]});

        state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
          [82,0,0,0,"AAU.OQ",0,null,null,null,null,"AAU.OQ","AAU.OQ Co.","EUR","XNYS/NYS-MAIN",750],[83,0,0,0,"AAU.AS",0,null,null,null,null,"AAU.AS","AAU.AS B.V","USD","XAMS/ENA-MAIN",676],[84,0,0,0,"AAV.L",0,null,null,null,null,"AAV.L","AAV.L London PLC","CAD","XLON/LSE-SETS",823],[85,0,0,0,"AAV.N",0,null,null,null,null,"AAV.N","AAV.N Corporation","EUR","XNGS/NAS-GSM",768],[86,0,0,0,"AAV.OQ",0,null,null,null,null,"AAV.OQ","AAV.OQ Co.","EUR","XNYS/NYS-MAIN",856],[87,0,0,0,"AAV.AS",0,null,null,null,null,"AAV.AS","AAV.AS B.V","GBX","XAMS/ENA-MAIN",120],[88,0,0,0,"AAW.L",0,null,null,null,null,"AAW.L","AAW.L London PLC","USD","XLON/LSE-SETS",900],[89,0,0,0,"AAW.N",0,null,null,null,null,"AAW.N","AAW.N Corporation","CAD","XNGS/NAS-GSM",48],[90,0,0,0,"AAW.OQ",0,null,null,null,null,"AAW.OQ","AAW.OQ Co.","USD","XNYS/NYS-MAIN",818],[91,0,0,0,"AAW.AS",0,null,null,null,null,"AAW.AS","AAW.AS B.V","USD","XAMS/ENA-MAIN",581],[92,0,0,0,"AAX.L",0,null,null,null,null,"AAX.L","AAX.L London PLC","GBX","XLON/LSE-SETS",761],[93,0,0,0,"AAX.N",0,null,null,null,null,"AAX.N","AAX.N Corporation","CAD","XNGS/NAS-GSM",435],[94,0,0,0,"AAX.OQ",0,null,null,null,null,"AAX.OQ","AAX.OQ Co.","EUR","XNYS/NYS-MAIN",407],[95,0,0,0,"AAX.AS",0,null,null,null,null,"AAX.AS","AAX.AS B.V","GBX","XAMS/ENA-MAIN",269],[96,0,0,0,"AAY.L",0,null,null,null,null,"AAY.L","AAY.L London PLC","EUR","XLON/LSE-SETS",774],[97,0,0,0,"AAY.N",0,null,null,null,null,"AAY.N","AAY.N Corporation","USD","XNGS/NAS-GSM",44],[98,0,0,0,"AAY.OQ",0,null,null,null,null,"AAY.OQ","AAY.OQ Co.","EUR","XNYS/NYS-MAIN",828],[99,0,0,0,"AAY.AS",0,null,null,null,null,"AAY.AS","AAY.AS B.V","EUR","XAMS/ENA-MAIN",767],[100,0,0,0,"AAZ.L",0,null,null,null,null,"AAZ.L","AAZ.L London PLC","EUR","XLON/LSE-SETS",637],[101,0,0,0,"AAZ.N",0,null,null,null,null,"AAZ.N","AAZ.N Corporation","GBX","XNGS/NAS-GSM",44],[102,0,0,0,"AAZ.OQ",0,null,null,null,null,"AAZ.OQ","AAZ.OQ Co.","USD","XNYS/NYS-MAIN",647],[103,0,0,0,"AAZ.AS",0,null,null,null,null,"AAZ.AS","AAZ.AS B.V","USD","XAMS/ENA-MAIN",312],[104,0,0,0,"ABA.L",0,null,null,null,null,"ABA.L","ABA.L London PLC","GBX","XLON/LSE-SETS",914],[105,0,0,0,"ABA.N",0,null,null,null,null,"ABA.N","ABA.N Corporation","CAD","XNGS/NAS-GSM",568],[106,0,0,0,"ABA.OQ",0,null,null,null,null,"ABA.OQ","ABA.OQ Co.","EUR","XNYS/NYS-MAIN",66],[107,0,0,0,"ABA.AS",0,null,null,null,null,"ABA.AS","ABA.AS B.V","CAD","XAMS/ENA-MAIN",325],[108,0,0,0,"ABB.L",0,null,null,null,null,"ABB.L","ABB.L London PLC","EUR","XLON/LSE-SETS",322],[109,0,0,0,"ABB.N",0,null,null,null,null,"ABB.N","ABB.N Corporation","USD","XNGS/NAS-GSM",126],[110,0,0,0,"ABB.OQ",0,null,null,null,null,"ABB.OQ","ABB.OQ Co.","GBX","XNYS/NYS-MAIN",351],[111,0,0,0,"ABB.AS",0,null,null,null,null,"ABB.AS","ABB.AS B.V","CAD","XAMS/ENA-MAIN",524],[112,0,0,0,"ABC.L",0,null,null,null,null,"ABC.L","ABC.L London PLC","EUR","XLON/LSE-SETS",686],[113,0,0,0,"ABC.N",0,null,null,null,null,"ABC.N","ABC.N Corporation","CAD","XNGS/NAS-GSM",751],[114,0,0,0,"ABC.OQ",0,null,null,null,null,"ABC.OQ","ABC.OQ Co.","CAD","XNYS/NYS-MAIN",283],[115,0,0,0,"ABC.AS",0,null,null,null,null,"ABC.AS","ABC.AS B.V","CAD","XAMS/ENA-MAIN",888],[116,0,0,0,"ABD.L",0,null,null,null,null,"ABD.L","ABD.L London PLC","EUR","XLON/LSE-SETS",895],[117,0,0,0,"ABD.N",0,null,null,null,null,"ABD.N","ABD.N Corporation","USD","XNGS/NAS-GSM",107],[118,0,0,0,"ABD.OQ",0,null,null,null,null,"ABD.OQ","ABD.OQ Co.","GBX","XNYS/NYS-MAIN",269],[119,0,0,0,"ABD.AS",0,null,null,null,null,"ABD.AS","ABD.AS B.V","GBX","XAMS/ENA-MAIN",308],[120,0,0,0,"ABE.L",0,null,null,null,null,"ABE.L","ABE.L London PLC","EUR","XLON/LSE-SETS",137],[121,0,0,0,"ABE.N",0,null,null,null,null,"ABE.N","ABE.N Corporation","GBX","XNGS/NAS-GSM",730],[122,0,0,0,"ABE.OQ",0,null,null,null,null,"ABE.OQ","ABE.OQ Co.","USD","XNYS/NYS-MAIN",509],[123,0,0,0,"ABE.AS",0,null,null,null,null,"ABE.AS","ABE.AS B.V","USD","XAMS/ENA-MAIN",852],[124,0,0,0,"ABF.L",0,null,null,null,null,"ABF.L","ABF.L London PLC","EUR","XLON/LSE-SETS",50],[125,0,0,0,"ABF.N",0,null,null,null,null,"ABF.N","ABF.N Corporation","CAD","XNGS/NAS-GSM",943],
          [126,0,0,0,"ABF.OQ",0,null,null,null,null,"ABF.OQ","ABF.OQ Co.","GBX","XNYS/NYS-MAIN",95]
        ]});

        state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
          [126,0,0,0,"ABF.OQ",0,null,null,null,null,"ABF.OQ","ABF.OQ Co.","GBX","XNYS/NYS-MAIN",95]
        ]});

        state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 115 } });

        // Turn around
        state = GridDataReducer(state, { type: 'range', range: { lo: 82, hi: 107 } });
        state = GridDataReducer(state, { type: 'range', range: { lo: 70, hi: 95 } });
        state = GridDataReducer(state, { type: 'range', range: { lo: 63, hi: 88 } });
        state = GridDataReducer(state, { type: 'range', range: { lo: 48, hi: 73 } });

        state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
          [53,0,0,0,"AAN.N",0,null,null,null,null,"AAN.N","AAN.N Corporation","CAD","XNGS/NAS-GSM",903],
          [54,0,0,0,"AAN.OQ",0,null,null,null,null,"AAN.OQ","AAN.OQ Co.","EUR","XNYS/NYS-MAIN",206],
          [55,0,0,0,"AAN.AS",0,null,null,null,null,"AAN.AS","AAN.AS B.V","USD","XAMS/ENA-MAIN",911],[56,0,0,0,"AAO.L",0,null,null,null,null,"AAO.L","AAO.L London PLC","CAD","XLON/LSE-SETS",356],[57,0,0,0,"AAO.N",0,null,null,null,null,"AAO.N","AAO.N Corporation","EUR","XNGS/NAS-GSM",211],[58,0,0,0,"AAO.OQ",0,null,null,null,null,"AAO.OQ","AAO.OQ Co.","CAD","XNYS/NYS-MAIN",310],[59,0,0,0,"AAO.AS",0,null,null,null,null,"AAO.AS","AAO.AS B.V","USD","XAMS/ENA-MAIN",654],[60,0,0,0,"AAP.L",0,null,null,null,null,"AAP.L","AAP.L London PLC","USD","XLON/LSE-SETS",169],[61,0,0,0,"AAP.N",0,null,null,null,null,"AAP.N","AAP.N Corporation","USD","XNGS/NAS-GSM",408],[62,0,0,0,"AAP.OQ",0,null,null,null,null,"AAP.OQ","AAP.OQ Co.","GBX","XNYS/NYS-MAIN",706],[63,0,0,0,"AAP.AS",0,null,null,null,null,"AAP.AS","AAP.AS B.V","USD","XAMS/ENA-MAIN",892],[64,0,0,0,"AAQ.L",0,null,null,null,null,"AAQ.L","AAQ.L London PLC","EUR","XLON/LSE-SETS",568],[65,0,0,0,"AAQ.N",0,null,null,null,null,"AAQ.N","AAQ.N Corporation","EUR","XNGS/NAS-GSM",313],[66,0,0,0,"AAQ.OQ",0,null,null,null,null,"AAQ.OQ","AAQ.OQ Co.","USD","XNYS/NYS-MAIN",607],[67,0,0,0,"AAQ.AS",0,null,null,null,null,"AAQ.AS","AAQ.AS B.V","CAD","XAMS/ENA-MAIN",451],[68,0,0,0,"AAR.L",0,null,null,null,null,"AAR.L","AAR.L London PLC","GBX","XLON/LSE-SETS",346],[69,0,0,0,"AAR.N",0,null,null,null,null,"AAR.N","AAR.N Corporation","GBX","XNGS/NAS-GSM",717],[70,0,0,0,"AAR.OQ",0,null,null,null,null,"AAR.OQ","AAR.OQ Co.","CAD","XNYS/NYS-MAIN",404],[71,0,0,0,"AAR.AS",0,null,null,null,null,"AAR.AS","AAR.AS B.V","GBX","XAMS/ENA-MAIN",606],[72,0,0,0,"AAS.L",0,null,null,null,null,"AAS.L","AAS.L London PLC","USD","XLON/LSE-SETS",19],[73,0,0,0,"AAS.N",0,null,null,null,null,"AAS.N","AAS.N Corporation","GBX","XNGS/NAS-GSM",429],[74,0,0,0,"AAS.OQ",0,null,null,null,null,"AAS.OQ","AAS.OQ Co.","EUR","XNYS/NYS-MAIN",170],[75,0,0,0,"AAS.AS",0,null,null,null,null,"AAS.AS","AAS.AS B.V","GBX","XAMS/ENA-MAIN",234],[76,0,0,0,"AAT.L",0,null,null,null,null,"AAT.L","AAT.L London PLC","CAD","XLON/LSE-SETS",202],[77,0,0,0,"AAT.N",0,null,null,null,null,"AAT.N","AAT.N Corporation","USD","XNGS/NAS-GSM",426],[78,0,0,0,"AAT.OQ",0,null,null,null,null,"AAT.OQ","AAT.OQ Co.","EUR","XNYS/NYS-MAIN",444],[79,0,0,0,"AAT.AS",0,null,null,null,null,"AAT.AS","AAT.AS B.V","CAD","XAMS/ENA-MAIN",134],[80,0,0,0,"AAU.L",0,null,null,null,null,"AAU.L","AAU.L London PLC","GBX","XLON/LSE-SETS",517],[81,0,0,0,"AAU.N",0,null,null,null,null,"AAU.N","AAU.N Corporation","GBX","XNGS/NAS-GSM",169],[82,0,0,0,"AAU.OQ",0,null,null,null,null,"AAU.OQ","AAU.OQ Co.","EUR","XNYS/NYS-MAIN",750],[83,0,0,0,"AAU.AS",0,null,null,null,null,"AAU.AS","AAU.AS B.V","USD","XAMS/ENA-MAIN",676],[84,0,0,0,"AAV.L",0,null,null,null,null,"AAV.L","AAV.L London PLC","CAD","XLON/LSE-SETS",823],[85,0,0,0,"AAV.N",0,null,null,null,null,"AAV.N","AAV.N Corporation","EUR","XNGS/NAS-GSM",768],[86,0,0,0,"AAV.OQ",0,null,null,null,null,"AAV.OQ","AAV.OQ Co.","EUR","XNYS/NYS-MAIN",856],[87,0,0,0,"AAV.AS",0,null,null,null,null,"AAV.AS","AAV.AS B.V","GBX","XAMS/ENA-MAIN",120],[88,0,0,0,"AAW.L",0,null,null,null,null,"AAW.L","AAW.L London PLC","USD","XLON/LSE-SETS",900],[89,0,0,0,"AAW.N",0,null,null,null,null,"AAW.N","AAW.N Corporation","CAD","XNGS/NAS-GSM",48],[90,0,0,0,"AAW.OQ",0,null,null,null,null,"AAW.OQ","AAW.OQ Co.","USD","XNYS/NYS-MAIN",818],[91,0,0,0,"AAW.AS",0,null,null,null,null,"AAW.AS","AAW.AS B.V","USD","XAMS/ENA-MAIN",581],[92,0,0,0,"AAX.L",0,null,null,null,null,"AAX.L","AAX.L London PLC","GBX","XLON/LSE-SETS",761],[93,0,0,0,"AAX.N",0,null,null,null,null,"AAX.N","AAX.N Corporation","CAD","XNGS/NAS-GSM",435],[94,0,0,0,"AAX.OQ",0,null,null,null,null,"AAX.OQ","AAX.OQ Co.","EUR","XNYS/NYS-MAIN",407],[95,0,0,0,"AAX.AS",0,null,null,null,null,"AAX.AS","AAX.AS B.V","GBX","XAMS/ENA-MAIN",269],
          [96,0,0,0,"AAY.L",0,null,null,null,null,"AAY.L","AAY.L London PLC","EUR","XLON/LSE-SETS",774],
          [97,0,0,0,"AAY.N",0,null,null,null,null,"AAY.N","AAY.N Corporation","USD","XNGS/NAS-GSM",44]
        ]});


        state = GridDataReducer(state, { type: 'range', range: { lo: 34, hi: 59 } });
        state = GridDataReducer(state, { type: 'range', range: { lo: 22, hi: 47 } });
        state = GridDataReducer(state, { type: 'range', range: { lo: 11, hi: 36 } });

        state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
          [12,0,0,0,"AAD.L",0,null,null,null,null,"AAD.L","AAD.L London PLC","CAD","XLON/LSE-SETS",363],[13,0,0,0,"AAD.N",0,null,null,null,null,"AAD.N","AAD.N Corporation","CAD","XNGS/NAS-GSM",696],[14,0,0,0,"AAD.OQ",0,null,null,null,null,"AAD.OQ","AAD.OQ Co.","EUR","XNYS/NYS-MAIN",806],[15,0,0,0,"AAD.AS",0,null,null,null,null,"AAD.AS","AAD.AS B.V","GBX","XAMS/ENA-MAIN",44],[16,0,0,0,"AAE.L",0,null,null,null,null,"AAE.L","AAE.L London PLC","GBX","XLON/LSE-SETS",226],[17,0,0,0,"AAE.N",0,null,null,null,null,"AAE.N","AAE.N Corporation","GBX","XNGS/NAS-GSM",54],[18,0,0,0,"AAE.OQ",0,null,null,null,null,"AAE.OQ","AAE.OQ Co.","USD","XNYS/NYS-MAIN",618],[19,0,0,0,"AAE.AS",0,null,null,null,null,"AAE.AS","AAE.AS B.V","CAD","XAMS/ENA-MAIN",643],[20,0,0,0,"AAF.L",0,null,null,null,null,"AAF.L","AAF.L London PLC","GBX","XLON/LSE-SETS",690],[21,0,0,0,"AAF.N",0,null,null,null,null,"AAF.N","AAF.N Corporation","CAD","XNGS/NAS-GSM",623],[22,0,0,0,"AAF.OQ",0,null,null,null,null,"AAF.OQ","AAF.OQ Co.","USD","XNYS/NYS-MAIN",167],[23,0,0,0,"AAF.AS",0,null,null,null,null,"AAF.AS","AAF.AS B.V","EUR","XAMS/ENA-MAIN",410],[24,0,0,0,"AAG.L",0,null,null,null,null,"AAG.L","AAG.L London PLC","EUR","XLON/LSE-SETS",928],[25,0,0,0,"AAG.N",0,null,null,null,null,"AAG.N","AAG.N Corporation","GBX","XNGS/NAS-GSM",900],[26,0,0,0,"AAG.OQ",0,null,null,null,null,"AAG.OQ","AAG.OQ Co.","CAD","XNYS/NYS-MAIN",896],[27,0,0,0,"AAG.AS",0,null,null,null,null,"AAG.AS","AAG.AS B.V","USD","XAMS/ENA-MAIN",934],[28,0,0,0,"AAH.L",0,null,null,null,null,"AAH.L","AAH.L London PLC","USD","XLON/LSE-SETS",553],[29,0,0,0,"AAH.N",0,null,null,null,null,"AAH.N","AAH.N Corporation","EUR","XNGS/NAS-GSM",879],[30,0,0,0,"AAH.OQ",0,null,null,null,null,"AAH.OQ","AAH.OQ Co.","GBX","XNYS/NYS-MAIN",943],[31,0,0,0,"AAH.AS",0,null,null,null,null,"AAH.AS","AAH.AS B.V","GBX","XAMS/ENA-MAIN",303],[32,0,0,0,"AAI.L",0,null,null,null,null,"AAI.L","AAI.L London PLC","CAD","XLON/LSE-SETS",430],[33,0,0,0,"AAI.N",0,null,null,null,null,"AAI.N","AAI.N Corporation","EUR","XNGS/NAS-GSM",628],[34,0,0,0,"AAI.OQ",0,null,null,null,null,"AAI.OQ","AAI.OQ Co.","CAD","XNYS/NYS-MAIN",720],[35,0,0,0,"AAI.AS",0,null,null,null,null,"AAI.AS","AAI.AS B.V","EUR","XAMS/ENA-MAIN",478],[36,0,0,0,"AAJ.L",0,null,null,null,null,"AAJ.L","AAJ.L London PLC","CAD","XLON/LSE-SETS",759],[37,0,0,0,"AAJ.N",0,null,null,null,null,"AAJ.N","AAJ.N Corporation","GBX","XNGS/NAS-GSM",697],[38,0,0,0,"AAJ.OQ",0,null,null,null,null,"AAJ.OQ","AAJ.OQ Co.","EUR","XNYS/NYS-MAIN",68],[39,0,0,0,"AAJ.AS",0,null,null,null,null,"AAJ.AS","AAJ.AS B.V","GBX","XAMS/ENA-MAIN",199],[40,0,0,0,"AAK.L",0,null,null,null,null,"AAK.L","AAK.L London PLC","USD","XLON/LSE-SETS",873],[41,0,0,0,"AAK.N",0,null,null,null,null,"AAK.N","AAK.N Corporation","EUR","XNGS/NAS-GSM",951],[42,0,0,0,"AAK.OQ",0,null,null,null,null,"AAK.OQ","AAK.OQ Co.","EUR","XNYS/NYS-MAIN",793],[43,0,0,0,"AAK.AS",0,null,null,null,null,"AAK.AS","AAK.AS B.V","USD","XAMS/ENA-MAIN",382],[44,0,0,0,"AAL.L",0,null,null,null,null,"AAL.L","AAL.L London PLC","GBX","XLON/LSE-SETS",578],[45,0,0,0,"AAL.N",0,null,null,null,null,"AAL.N","AAL.N Corporation","CAD","XNGS/NAS-GSM",328],[46,0,0,0,"AAL.OQ",0,null,null,null,null,"AAL.OQ","AAL.OQ Co.","EUR","XNYS/NYS-MAIN",76],[47,0,0,0,"AAL.AS",0,null,null,null,null,"AAL.AS","AAL.AS B.V","CAD","XAMS/ENA-MAIN",691],[48,0,0,0,"AAM.L",0,null,null,null,null,"AAM.L","AAM.L London PLC","GBX","XLON/LSE-SETS",161],[49,0,0,0,"AAM.N",0,null,null,null,null,"AAM.N","AAM.N Corporation","CAD","XNGS/NAS-GSM",57],[50,0,0,0,"AAM.OQ",0,null,null,null,null,"AAM.OQ","AAM.OQ Co.","CAD","XNYS/NYS-MAIN",201],[51,0,0,0,"AAM.AS",0,null,null,null,null,"AAM.AS","AAM.AS B.V","USD","XAMS/ENA-MAIN",432],[52,0,0,0,"AAN.L",0,null,null,null,null,"AAN.L","AAN.L London PLC","USD","XLON/LSE-SETS",80],[53,0,0,0,"AAN.N",0,null,null,null,null,"AAN.N","AAN.N Corporation","CAD","XNGS/NAS-GSM",903],[54,0,0,0,"AAN.OQ",0,null,null,null,null,"AAN.OQ","AAN.OQ Co.","EUR","XNYS/NYS-MAIN",206],
          [55,0,0,0,"AAN.AS",0,null,null,null,null,"AAN.AS","AAN.AS B.V","USD","XAMS/ENA-MAIN",911],
          [56,0,0,0,"AAO.L",0,null,null,null,null,"AAO.L","AAO.L London PLC","CAD","XLON/LSE-SETS",356]
        ]});

        state = GridDataReducer(state, { type: 'range', range: { lo: 2, hi: 27 } });
        state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 25 } });
        state = GridDataReducer(state, { type: 'data', offset: 0, rowCount: 1000, rows: [
          [0,0,0,0,"AAA.L",0,null,null,null,null,"AAA.L","AAA.L London PLC","USD","XLON/LSE-SETS",633],
          [1,0,0,0,"AAA.N",0,null,null,null,null,"AAA.N","AAA.N Corporation","EUR","XNGS/NAS-GSM",220],
          [2,0,0,0,"AAA.OQ",0,null,null,null,null,"AAA.OQ","AAA.OQ Co.","EUR","XNYS/NYS-MAIN",393],
          [3,0,0,0,"AAA.AS",0,null,null,null,null,"AAA.AS","AAA.AS B.V","GBX","XAMS/ENA-MAIN",449],
          [4,0,0,0,"AAB.L",0,null,null,null,null,"AAB.L","AAB.L London PLC","GBX","XLON/LSE-SETS",37],
          [5,0,0,0,"AAB.N",0,null,null,null,null,"AAB.N","AAB.N Corporation","CAD","XNGS/NAS-GSM",38],[6,0,0,0,"AAB.OQ",0,null,null,null,null,"AAB.OQ","AAB.OQ Co.","GBX","XNYS/NYS-MAIN",286],[7,0,0,0,"AAB.AS",0,null,null,null,null,"AAB.AS","AAB.AS B.V","USD","XAMS/ENA-MAIN",364],[8,0,0,0,"AAC.L",0,null,null,null,null,"AAC.L","AAC.L London PLC","EUR","XLON/LSE-SETS",12],[9,0,0,0,"AAC.N",0,null,null,null,null,"AAC.N","AAC.N Corporation","CAD","XNGS/NAS-GSM",927],[10,0,0,0,"AAC.OQ",0,null,null,null,null,"AAC.OQ","AAC.OQ Co.","GBX","XNYS/NYS-MAIN",559],[11,0,0,0,"AAC.AS",0,null,null,null,null,"AAC.AS","AAC.AS B.V","CAD","XAMS/ENA-MAIN",946],[12,0,0,0,"AAD.L",0,null,null,null,null,"AAD.L","AAD.L London PLC","CAD","XLON/LSE-SETS",363],[13,0,0,0,"AAD.N",0,null,null,null,null,"AAD.N","AAD.N Corporation","CAD","XNGS/NAS-GSM",696],[14,0,0,0,"AAD.OQ",0,null,null,null,null,"AAD.OQ","AAD.OQ Co.","EUR","XNYS/NYS-MAIN",806],[15,0,0,0,"AAD.AS",0,null,null,null,null,"AAD.AS","AAD.AS B.V","GBX","XAMS/ENA-MAIN",44],[16,0,0,0,"AAE.L",0,null,null,null,null,"AAE.L","AAE.L London PLC","GBX","XLON/LSE-SETS",226],[17,0,0,0,"AAE.N",0,null,null,null,null,"AAE.N","AAE.N Corporation","GBX","XNGS/NAS-GSM",54],[18,0,0,0,"AAE.OQ",0,null,null,null,null,"AAE.OQ","AAE.OQ Co.","USD","XNYS/NYS-MAIN",618],[19,0,0,0,"AAE.AS",0,null,null,null,null,"AAE.AS","AAE.AS B.V","CAD","XAMS/ENA-MAIN",643],[20,0,0,0,"AAF.L",0,null,null,null,null,"AAF.L","AAF.L London PLC","GBX","XLON/LSE-SETS",690],[21,0,0,0,"AAF.N",0,null,null,null,null,"AAF.N","AAF.N Corporation","CAD","XNGS/NAS-GSM",623],[22,0,0,0,"AAF.OQ",0,null,null,null,null,"AAF.OQ","AAF.OQ Co.","USD","XNYS/NYS-MAIN",167],[23,0,0,0,"AAF.AS",0,null,null,null,null,"AAF.AS","AAF.AS B.V","EUR","XAMS/ENA-MAIN",410],[24,0,0,0,"AAG.L",0,null,null,null,null,"AAG.L","AAG.L London PLC","EUR","XLON/LSE-SETS",928],[25,0,0,0,"AAG.N",0,null,null,null,null,"AAG.N","AAG.N Corporation","GBX","XNGS/NAS-GSM",900],[26,0,0,0,"AAG.OQ",0,null,null,null,null,"AAG.OQ","AAG.OQ Co.","CAD","XNYS/NYS-MAIN",896],[27,0,0,0,"AAG.AS",0,null,null,null,null,"AAG.AS","AAG.AS B.V","USD","XAMS/ENA-MAIN",934],[28,0,0,0,"AAH.L",0,null,null,null,null,"AAH.L","AAH.L London PLC","USD","XLON/LSE-SETS",553],[29,0,0,0,"AAH.N",0,null,null,null,null,"AAH.N","AAH.N Corporation","EUR","XNGS/NAS-GSM",879],[30,0,0,0,"AAH.OQ",0,null,null,null,null,"AAH.OQ","AAH.OQ Co.","GBX","XNYS/NYS-MAIN",943],[31,0,0,0,"AAH.AS",0,null,null,null,null,"AAH.AS","AAH.AS B.V","GBX","XAMS/ENA-MAIN",303],[32,0,0,0,"AAI.L",0,null,null,null,null,"AAI.L","AAI.L London PLC","CAD","XLON/LSE-SETS",430],[33,0,0,0,"AAI.N",0,null,null,null,null,"AAI.N","AAI.N Corporation","EUR","XNGS/NAS-GSM",628],
          [34,0,0,0,"AAI.OQ",0,null,null,null,null,"AAI.OQ","AAI.OQ Co.","CAD","XNYS/NYS-MAIN",720]
        ]});

        expect(uniqueKeys(state.rows)).toEqual(true);

    })

  })

  describe('real world tests', () => {

    test('doomed rows removed, keys reclaimed', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 100, range: { lo: 0, hi: 20 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(0, 120) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 3, hi: 23 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 16, hi: 36 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 46, hi: 66 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 73, hi: 93 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(120, 193) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 103, hi: 123 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 122, hi: 142 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 137, hi: 157 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(193, 257) });
      expect(state.buffer.length).toBe(220);

      state = GridDataReducer(state, { type: 'range', range: { lo: 150, hi: 170 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 160, hi: 180 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 165, hi: 185 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 168, hi: 188 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 170, hi: 190 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 172, hi: 192 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 174, hi: 194 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 175, hi: 195 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 177, hi: 197 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 178, hi: 198 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 180, hi: 200 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 181, hi: 201 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 182, hi: 202 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 183, hi: 203 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 184, hi: 204 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 185, hi: 205 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 186, hi: 206 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 187, hi: 207 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(257, 307) });
      expect(state.buffer.length).toBe(220);


      state = GridDataReducer(state, { type: 'range', range: { lo: 188, hi: 208 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 189, hi: 209 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 190, hi: 210 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 191, hi: 211 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 192, hi: 212 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 193, hi: 213 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 194, hi: 214 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 195, hi: 215 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 203, hi: 223 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 211, hi: 231 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 237, hi: 257 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(307, 357) });
      expect(state.buffer.length).toBe(220);

      state = GridDataReducer(state, { type: 'range', range: { lo: 269, hi: 289 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 290, hi: 310 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(357, 410) });

      expect(state.buffer.length).toBe(220);

    });

    test('jump to near end, scroll backwards', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 100, range: { lo: 0, hi: 40 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0, 140) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 1104, hi: 1144 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(1004, 1244) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 1103, hi: 1143 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 1100, hi: 1140 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 1094, hi: 1134 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 1082, hi: 1122 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 1071, hi: 1111 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 1061, hi: 1101 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 1049, hi: 1089 } });

      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(949, 1004) });

      expect(state.rows).toEqual([
        [1149, 25, 0, 0, 'key-049'],
        [1150, 26, 0, 0, 'key-050'],
        [1151, 27, 0, 0, 'key-051'],
        [1152, 28, 0, 0, 'key-052'],
        [1153, 29, 0, 0, 'key-053'],
        [1154, 30, 0, 0, 'key-054'],
        [1155, 31, 0, 0, 'key-055'],
        [1156, 32, 0, 0, 'key-056'],
        [1157, 33, 0, 0, 'key-057'],
        [1158, 34, 0, 0, 'key-058'],
        [1159, 35, 0, 0, 'key-059'],
        [1160, 36, 0, 0, 'key-060'],
        [1161, 37, 0, 0, 'key-061'],
        [1162, 38, 0, 0, 'key-062'],
        [1163, 39, 0, 0, 'key-063'],
        [1164, 0, 0, 0, 'key-064'],
        [1165, 1, 0, 0, 'key-065'],
        [1166, 2, 0, 0, 'key-066'],
        [1167, 3, 0, 0, 'key-067'],
        [1168, 4, 0, 0, 'key-068'],
        [1169, 5, 0, 0, 'key-069'],
        [1170, 6, 0, 0, 'key-070'],
        [1171, 7, 0, 0, 'key-071'],
        [1172, 8, 0, 0, 'key-072'],
        [1173, 9, 0, 0, 'key-073'],
        [1174, 10, 0, 0, 'key-074'],
        [1175, 11, 0, 0, 'key-075'],
        [1176, 12, 0, 0, 'key-076'],
        [1177, 13, 0, 0, 'key-077'],
        [1178, 14, 0, 0, 'key-078'],
        [1179, 15, 0, 0, 'key-079'],
        [1180, 16, 0, 0, 'key-080'],
        [1181, 17, 0, 0, 'key-081'],
        [1182, 18, 0, 0, 'key-082'],
        [1183, 19, 0, 0, 'key-083'],
        [1184, 20, 0, 0, 'key-084'],
        [1185, 21, 0, 0, 'key-085'],
        [1186, 22, 0, 0, 'key-086'],
        [1187, 23, 0, 0, 'key-087'],
        [1188, 24, 0, 0, 'key-088']
      ]);

    });

    test('jump to near end, scroll backwards, using renderBuffer', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 100, range: { lo: 0, hi: 63 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0, 163) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 1186, hi: 1269 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(1086, 1247) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 1184, hi: 1267 } });


    })

    test('scroll gently forward, then backwards', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 100, range: { lo: 0, hi: 40 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0, 140) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 1, hi: 41 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 2, hi: 42 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 3, hi: 43 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 4, hi: 44 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 3, hi: 43 } });

    });


    test('scroll ahead quickly, with buffering, then backwards', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 10, range: { lo: 0, hi: 25 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [100, 0, 0, 0, "TFSC", 0, null, null, null, null, "TFSC", "1347 Capital Corp.", 9.4345671, 56090000, "2014", "Finance", "Business Services"],
          [101, 0, 0, 0, "PIH", 0, null, null, null, null, "PIH", "1347 Property Insurance Holdings, Inc.", 7.6400987, 48580000, "2014", "Finance", "Property-Casualty Insurers"],
          [102, 0, 0, 0, "FLWS", 0, null, null, null, null, "FLWS", "1-800 FLOWERS.COM, Inc.", 10.3300001, 668420000, "1999", "Consumer Services", "Other Specialty Stores"],
          [103, 0, 0, 0, "VNET", 0, null, null, null, null, "VNET", "21Vianet Group, Inc.", 19.05, 1250000000, "2011", "Technology", "Computer Software: Programming, Data Processing"],
          [104, 0, 0, 0, "TWOU", 0, null, null, null, null, "TWOU", "2U, Inc.", 17.11, 693670000, "2014", "Technology", "Computer Software: Prepackaged Software"],
          [105, 0, 0, 0, "JOBS", 0, null, null, null, null, "JOBS", "51job, Inc.", 34.86, 2060000000, "2004", "Technology", "Diversified Commercial Services"],
          [106, 0, 0, 0, "SHLM", 0, null, null, null, null, "SHLM", "A. Schulman, Inc.", 39.83, 1160000000, "1972", "Basic Industries", "Major Chemicals"],
          [107, 0, 0, 0, "ABAX", 0, null, null, null, null, "ABAX", "ABAXIS, Inc.", 60.93, 1370000000, "1992", "Capital Goods", "Industrial Machinery/Components"],
          [108, 0, 0, 0, "ABY", 0, null, null, null, null, "ABY", "Abengoa Yield plc", 34.4, 2750000000, "2014", "Public Utilities", "Electric Utilities: Central"],
          [109, 0, 0, 0, "ABGB", 0, null, null, null, null, "ABGB", "Abengoa, S.A.", 15.52, 2610000000, "2013", "Consumer Services", "Military/Government/Technical"],
          [110, 0, 0, 0, "ACAD", 0, null, null, null, null, "ACAD", "ACADIA Pharmaceuticals Inc.", 34.21, 3410000000, "1985", "Health Care", "Major Pharmaceuticals"],
          [111, 0, 0, 0, "XLRN", 0, null, null, null, null, "XLRN", "Acceleron Pharma Inc.", 38.02, 1230000000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"],
          [112, 0, 0, 0, "ARAY", 0, null, null, null, null, "ARAY", "Accuray Incorporated", 8, 627920000, "2007", "Health Care", "Medical/Dental Instruments"], [113, 0, 0, 0, "ACRX", 0, null, null, null, null, "ACRX", "AcelRx Pharmaceuticals, Inc.", 7.29, 318630000, "2011", "Health Care", "Major Pharmaceuticals"], [114, 0, 0, 0, "AKAO", 0, null, null, null, null, "AKAO", "Achaogen, Inc.", 11.11, 197290000, "2014", "Health Care", "Major Pharmaceuticals"], [115, 0, 0, 0, "ACHN", 0, null, null, null, null, "ACHN", "Achillion Pharmaceuticals, Inc.", 10.89, 1090000000, "2006", "Health Care", "Major Pharmaceuticals"], [116, 0, 0, 0, "ACOR", 0, null, null, null, null, "ACOR", "Acorda Therapeutics, Inc.", 36.14, 1520000000, "2006", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [117, 0, 0, 0, "ACTS", 0, null, null, null, null, "ACTS", "Actions Semiconductor Co., Ltd.", 1.54, 132440000, "2005", "Technology", "Semiconductors"], [118, 0, 0, 0, "ACPW", 0, null, null, null, null, "ACPW", "Active Power, Inc.", 1.86, 42950000, "2000", "Public Utilities", "Electric Utilities: Central"], [119, 0, 0, 0, "ADMS", 0, null, null, null, null, "ADMS", "Adamas Pharmaceuticals, Inc.", 16.98, 290800000, "2014", "Health Care", "Major Pharmaceuticals"], [120, 0, 0, 0, "ADUS", 0, null, null, null, null, "ADUS", "Addus HomeCare Corporation", 21.57, 237050000, "2009", "Health Care", "Medical/Nursing Services"], [121, 0, 0, 0, "ADBE", 0, null, null, null, null, "ADBE", "Adobe Systems Incorporated", 76.51, 38130000000, "1986", "Technology", "Computer Software: Prepackaged Software"], [122, 0, 0, 0, "ADTN", 0, null, null, null, null, "ADTN", "ADTRAN, Inc.", 23.11, 1260000000, "1994", "Public Utilities", "Telecommunications Equipment"], [123, 0, 0, 0, "AEIS", 0, null, null, null, null, "AEIS", "Advanced Energy Industries, Inc.", 26.68, 1070000000, "1995", "Capital Goods", "Industrial Machinery/Components"], [124, 0, 0, 0, "ADVS", 0, null, null, null, null, "ADVS", "Advent Software, Inc.", 44.18, 2280000000, "1995", "Technology", "EDP Services"], [125, 0, 0, 0, "AEGR", 0, null, null, null, null, "AEGR", "Aegerion Pharmaceuticals, Inc.", 25.15, 715170000, "2010", "Health Care", "Major Pharmaceuticals"], [126, 0, 0, 0, "AEHR", 0, null, null, null, null, "AEHR", "Aehr Test Systems", 2.47, 31300000, "1997", "Capital Goods", "Electrical Products"], [127, 0, 0, 0, "AEPI", 0, null, null, null, null, "AEPI", "AEP Industries Inc.", 49.71, 252560000, "1986", "Capital Goods", "Specialty Chemicals"], [128, 0, 0, 0, "AERI", 0, null, null, null, null, "AERI", "Aerie Pharmaceuticals, Inc.", 27.91, 669410000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [129, 0, 0, 0, "AVAV", 0, null, null, null, null, "AVAV", "AeroVironment, Inc.", 26.86, 626430000, "2007", "Capital Goods", "Aerospace"], [130, 0, 0, 0, "AFMD", 0, null, null, null, null, "AFMD", "Affimed N.V.", 5.7, 136710000, "2014", "Health Care", "Major Pharmaceuticals"], [131, 0, 0, 0, "AFFX", 0, null, null, null, null, "AFFX", "Affymetrix, Inc.", 11.45, 842530000, "1996", "Capital Goods", "Biotechnology: Laboratory Analytical Instruments"], [132, 0, 0, 0, "AGEN", 0, null, null, null, null, "AGEN", "Agenus Inc.", 5.03, 315300000, "2000", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [133, 0, 0, 0, "AGRX", 0, null, null, null, null, "AGRX", "Agile Therapeutics, Inc.", 8.57, 171500000, "2014", "Health Care", "Major Pharmaceuticals"],
          [134, 0, 0, 0, "AGIO", 0, null, null, null, null, "AGIO", "Agios Pharmaceuticals, Inc.", 118.55, 4380000000, "2013", "Health Care", "Major Pharmaceuticals"]]
      });
      state = GridDataReducer(state, { type: 'range', range: { lo: 4, hi: 29 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 15, hi: 40 } });

      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1247, rows: [
          [135, 0, 0, 0, "AMCN", 0, null, null, null, null, "AMCN", "AirMedia Group Inc", 2.28, 135810000, "2007", "Technology", "Advertising"],
          [136, 0, 0, 0, "AKAM", 0, null, null, null, null, "AKAM", "Akamai Technologies, Inc.", 68.77, 12240000000, "1999", "Miscellaneous", "Business Services"],
          [137, 0, 0, 0, "AKBA", 0, null, null, null, null, "AKBA", "Akebia Therapeutics, Inc.", 9.32, 189580000, "2014", "Health Care", "Major Pharmaceuticals"],
          [138, 0, 0, 0, "AKER", 0, null, null, null, null, "AKER", "Akers Biosciences Inc", 3.5, 17340000, "2014", "Health Care", "Biotechnology: In Vitro & In Vivo Diagnostic Substances"],
          [139, 0, 0, 0, "ALSK", 0, null, null, null, null, "ALSK", "Alaska Communications Systems Group, Inc.", 1.75, 86690000, "1999", "Public Utilities", "Telecommunications Equipment"],
          [140, 0, 0, 0, "AMRI", 0, null, null, null, null, "AMRI", "Albany Molecular Research, Inc.", 16.94, 552360000, "1999", "Health Care", "Biotechnology: Commercial Physical & Biological Resarch"],
          [141, 0, 0, 0, "ADHD", 0, null, null, null, null, "ADHD", "Alcobra Ltd.", 6.92, 146550000, "2013", "Health Care", "Major Pharmaceuticals"],
          [142, 0, 0, 0, "ALDR", 0, null, null, null, null, "ALDR", "Alder BioPharmaceuticals, Inc.", 26.06, 982630000, "2014", "Health Care", "Major Pharmaceuticals"],
          [143, 0, 0, 0, "ALDX", 0, null, null, null, null, "ALDX", "Aldeyra Therapeutics, Inc.", 11.01, 61280000, "2014", "Health Care", "Major Pharmaceuticals"],
          [144, 0, 0, 0, "ALXN", 0, null, null, null, null, "ALXN", "Alexion Pharmaceuticals, Inc.", 182.29, 36850000000, "1996", "Health Care", "Major Pharmaceuticals"],
          [145, 0, 0, 0, "ALXA", 0, null, null, null, null, "ALXA", "Alexza Pharmaceuticals, Inc.", 2.07, 40170000, "2006", "Health Care", "Major Pharmaceuticals"],
          [146, 0, 0, 0, "ALGN", 0, null, null, null, null, "ALGN", "Align Technology, Inc.", 56.9, 4570000000, "2001", "Health Care", "Industrial Specialties"],
          [147, 0, 0, 0, "ALIM", 0, null, null, null, null, "ALIM", "Alimera Sciences, Inc.", 5.16, 228570000, "2010", "Health Care", "Major Pharmaceuticals"],
          [148, 0, 0, 0, "ALKS", 0, null, null, null, null, "ALKS", "Alkermes plc", 71.4, 10440000000, "1991", "Health Care", "Major Pharmaceuticals"],
          [149, 0, 0, 0, "ALGT", 0, null, null, null, null, "ALGT", "Allegiant Travel Company", 178.42, 3120000000, "2006", "Transportation", "Air Freight/Delivery Services"]
        ]
      });

      state = GridDataReducer(state, { type: 'range', range: { lo: 29, hi: 54 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[150, 0, 0, 0, "AFOP", 0, null, null, null, null, "AFOP", "Alliance Fiber Optic Products, Inc.", 16.51, 307950000, "2000", "Technology", "Semiconductors"], [151, 0, 0, 0, "AIQ", 0, null, null, null, null, "AIQ", "Alliance HealthCare Services, Inc.", 24.99, 268250000, "2001", "Health Care", "Medical Specialities"], [152, 0, 0, 0, "AHGP", 0, null, null, null, null, "AHGP", "Alliance Holdings GP, L.P.", 53, 3170000000, "2006", "Energy", "Coal Mining"], [153, 0, 0, 0, "ARLP", 0, null, null, null, null, "ARLP", "Alliance Resource Partners, L.P.", 39.29, 2910000000, "1999", "Energy", "Coal Mining"], [154, 0, 0, 0, "AHPI", 0, null, null, null, null, "AHPI", "Allied Healthcare Products, Inc.", 1.56, 12520000, "1992", "Health Care", "Industrial Specialties"], [155, 0, 0, 0, "ALLT", 0, null, null, null, null, "ALLT", "Allot Communications Ltd.", 9.15, 304210000, "2006", "Technology", "Computer Communications Equipment"], [156, 0, 0, 0, "ALNY", 0, null, null, null, null, "ALNY", "Alnylam Pharmaceuticals, Inc.", 95.54, 7830000000, "2004", "Health Care", "Major Pharmaceuticals"], [157, 0, 0, 0, "AOSL", 0, null, null, null, null, "AOSL", "Alpha and Omega Semiconductor Limited", 9.05, 241240000, "2010", "Technology", "Semiconductors"], [158, 0, 0, 0, "ATEC", 0, null, null, null, null, "ATEC", "Alphatec Holdings, Inc.", 1.34, 133460000, "2006", "Health Care", "Medical/Dental Instruments"], [159, 0, 0, 0, "ALTR", 0, null, null, null, null, "ALTR", "Altera Corporation", 35.66, 10870000000, "1988", "Technology", "Semiconductors"], [160, 0, 0, 0, "AIMC", 0, null, null, null, null, "AIMC", "Altra Industrial Motion Corp.", 27.85, 741790000, "2006", "Capital Goods", "Industrial Machinery/Components"], [161, 0, 0, 0, "AMZN", 0, null, null, null, null, "AMZN", "Amazon.com, Inc.", 381.83, 177320000000, "1997", "Consumer Services", "Catalog/Specialty Distribution"], [162, 0, 0, 0, "AMBA", 0, null, null, null, null, "AMBA", "Ambarella, Inc.", 50.71, 1540000000, "2012", "Technology", "Semiconductors"], [163, 0, 0, 0, "AMDA", 0, null, null, null, null, "AMDA", "Amedica Corporation", 0.65, 8970000, "2014", "Health Care", "Medical/Dental Instruments"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 42, hi: 67 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[164, 0, 0, 0, "AGNC", 0, null, null, null, null, "AGNC", "American Capital Agency Corp.", 21.95, 7740000000, "2008", "Consumer Services", "Real Estate Investment Trusts"], [165, 0, 0, 0, "MTGE", 0, null, null, null, null, "MTGE", "American Capital Mortgage Investment Corp.", 18.33, 937430000, "2011", "Consumer Services", "Real Estate Investment Trusts"], [166, 0, 0, 0, "APEI", 0, null, null, null, null, "APEI", "American Public Education, Inc.", 34.36, 593210000, "2007", "Consumer Services", "Other Consumer Services"], [167, 0, 0, 0, "ARII", 0, null, null, null, null, "ARII", "American Railcar Industries, Inc.", 54.26, 1160000000, "2006", "Capital Goods", "Railroads"], [168, 0, 0, 0, "ARCP", 0, null, null, null, null, "ARCP", "American Realty Capital Properties, Inc.", 9.4, 8540000000, "2011", "Consumer Services", "Real Estate Investment Trusts"], [169, 0, 0, 0, "AMSC", 0, null, null, null, null, "AMSC", "American Superconductor Corporation", 0.7999, 76570000, "1991", "Consumer Durables", "Metal Fabrications"], [170, 0, 0, 0, "AMWD", 0, null, null, null, null, "AMWD", "American Woodmark Corporation", 43.98, 696160000, "1986", "Basic Industries", "Forest Products"], [171, 0, 0, 0, "ABCB", 0, null, null, null, null, "ABCB", "Ameris Bancorp", 25.75, 725140000, "1994", "Finance", "Major Banks"], [172, 0, 0, 0, "AMSF", 0, null, null, null, null, "AMSF", "AMERISAFE, Inc.", 43.7, 822560000, "2005", "Finance", "Property-Casualty Insurers"], [173, 0, 0, 0, "AMGN", 0, null, null, null, null, "AMGN", "Amgen Inc.", 153.48, 116750000000, "1983", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [174, 0, 0, 0, "FOLD", 0, null, null, null, null, "FOLD", "Amicus Therapeutics, Inc.", 8.36, 796280000, "2007", "Health Care", "Major Pharmaceuticals"], [175, 0, 0, 0, "AMKR", 0, null, null, null, null, "AMKR", "Amkor Technology, Inc.", 8.9, 2110000000, "1998", "Technology", "Semiconductors"], [176, 0, 0, 0, "AMPH", 0, null, null, null, null, "AMPH", "Amphastar Pharmaceuticals, Inc.", 12.76, 569720000, "2014", "Health Care", "Major Pharmaceuticals"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 53, hi: 78 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[177, 0, 0, 0, "AMRS", 0, null, null, null, null, "AMRS", "Amyris, Inc.", 2.09, 165270000, "2010", "Basic Industries", "Major Chemicals"], [178, 0, 0, 0, "ANAC", 0, null, null, null, null, "ANAC", "Anacor Pharmaceuticals, Inc.", 40.76, 1750000000, "2010", "Health Care", "Major Pharmaceuticals"], [179, 0, 0, 0, "ANAD", 0, null, null, null, null, "ANAD", "ANADIGICS, Inc.", 1.26, 109090000, "1995", "Technology", "Semiconductors"], [180, 0, 0, 0, "ALOG", 0, null, null, null, null, "ALOG", "Analogic Corporation", 86.55, 1070000000, "1972", "Capital Goods", "Electrical Products"], [181, 0, 0, 0, "ANCB", 0, null, null, null, null, "ANCB", "Anchor Bancorp", 22.14, 56460000, "2011", "Finance", "Banks"], [182, 0, 0, 0, "ABCW", 0, null, null, null, null, "ABCW", "Anchor BanCorp Wisconsin Inc.", 33.49, 309630000, "2014", "Finance", "Banks"], [183, 0, 0, 0, "AMCF", 0, null, null, null, null, "AMCF", "Andatee China Marine Fuel Services Corporation", 1.44, 14770000, "2010", "Energy", "Oil Refining/Marketing"], [184, 0, 0, 0, "ANGI", 0, null, null, null, null, "ANGI", "Angie&#39;s List, Inc.", 5.02, 293750000, "2011", "Consumer Services", "Advertising"], [185, 0, 0, 0, "ANGO", 0, null, null, null, null, "ANGO", "AngioDynamics, Inc.", 18.78, 672720000, "2004", "Health Care", "Medical/Dental Instruments"], [186, 0, 0, 0, "ANSS", 0, null, null, null, null, "ANSS", "ANSYS, Inc.", 86.26, 7930000000, "1996", "Technology", "Computer Software: Prepackaged Software"], [187, 0, 0, 0, "ANTH", 0, null, null, null, null, "ANTH", "Anthera Pharmaceuticals, Inc.", 3.84, 88090000, "2010", "Health Care", "Major Pharmaceuticals"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 63, hi: 88 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[188, 0, 0, 0, "APOL", 0, null, null, null, null, "APOL", "Apollo Education Group, Inc.", 25.97, 2810000000, "1994", "Consumer Services", "Other Consumer Services"], [189, 0, 0, 0, "AAPL", 0, null, null, null, null, "AAPL", "Apple Inc.", 127.08, 740210000000, "1980", "Technology", "Computer Manufacturing"], [190, 0, 0, 0, "AGTC", 0, null, null, null, null, "AGTC", "Applied Genetic Technologies Corporation", 24.49, 401900000, "2014", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [191, 0, 0, 0, "AMAT", 0, null, null, null, null, "AMAT", "Applied Materials, Inc.", 24.12, 29460000000, "1972", "Technology", "Semiconductors"], [192, 0, 0, 0, "AMCC", 0, null, null, null, null, "AMCC", "Applied Micro Circuits Corporation", 5.21, 412320000, "1997", "Technology", "Semiconductors"], [193, 0, 0, 0, "AAOI", 0, null, null, null, null, "AAOI", "Applied Optoelectronics, Inc.", 10.15, 150380000, "2013", "Technology", "Semiconductors"], [194, 0, 0, 0, "AREX", 0, null, null, null, null, "AREX", "Approach Resources Inc.", 8.15, 322380000, "2007", "Energy", "Oil & Gas Production"], [195, 0, 0, 0, "AQXP", 0, null, null, null, null, "AQXP", "Aquinox Pharmaceuticals, Inc.", 10.29, 110050000, "2014", "Health Care", "Major Pharmaceuticals"], [196, 0, 0, 0, "AUMA", 0, null, null, null, null, "AUMA", "AR Capital Acquisition Corp.", 9.75, 292500000, "2014", "Finance", "Business Services"], [197, 0, 0, 0, "ARDM", 0, null, null, null, null, "ARDM", "Aradigm Corporation", 7.66, 112810000, "1996", "Health Care", "Biotechnology: Electromedical & Electrotherapeutic Apparatus"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 72, hi: 97 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[198, 0, 0, 0, "PETX", 0, null, null, null, null, "PETX", "Aratana Therapeutics, Inc.", 16.52, 573330000, "2013", "Health Care", "Major Pharmaceuticals"], [199, 0, 0, 0, "ACAT", 0, null, null, null, null, "ACAT", "Arctic Cat Inc.", 39, 504930000, "1990", "Capital Goods", "Industrial Specialties"], [200, 0, 0, 0, "ARDX", 0, null, null, null, null, "ARDX", "Ardelyx, Inc.", 17.14, 317780000, "2014", "Health Care", "Major Pharmaceuticals"], [201, 0, 0, 0, "ARNA", 0, null, null, null, null, "ARNA", "Arena Pharmaceuticals, Inc.", 4.55, 1000000000, "2000", "Health Care", "Major Pharmaceuticals"], [202, 0, 0, 0, "ARGS", 0, null, null, null, null, "ARGS", "Argos Therapeutics, Inc.", 8.35, 164120000, "2014", "Health Care", "Major Pharmaceuticals"], [203, 0, 0, 0, "ARIS", 0, null, null, null, null, "ARIS", "ARI Network Services, Inc.", 3.63, 51660000, "1991", "Technology", "Computer Software: Programming, Data Processing"], [204, 0, 0, 0, "ARIA", 0, null, null, null, null, "ARIA", "ARIAD Pharmaceuticals, Inc.", 7.35, 1380000000, "1994", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [205, 0, 0, 0, "ARTX", 0, null, null, null, null, "ARTX", "Arotech Corporation", 2.44, 59640000, "1994", "Miscellaneous", "Industrial Machinery/Components"], [206, 0, 0, 0, "ARQL", 0, null, null, null, null, "ARQL", "ArQule, Inc.", 1.35, 84740000, "1996", "Health Care", "Major Pharmaceuticals"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 80, hi: 105 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[207, 0, 0, 0, "ARRY", 0, null, null, null, null, "ARRY", "Array BioPharma Inc.", 8.05, 1120000000, "2000", "Health Care", "Major Pharmaceuticals"], [208, 0, 0, 0, "ARUN", 0, null, null, null, null, "ARUN", "Aruba Networks, Inc.", 17.7, 1940000000, "2007", "Technology", "Computer peripheral equipment"], [209, 0, 0, 0, "ASBB", 0, null, null, null, null, "ASBB", "ASB Bancorp, Inc.", 19.9, 87130000, "2011", "Finance", "Savings Institutions"], [210, 0, 0, 0, "ASML", 0, null, null, null, null, "ASML", "ASML Holding N.V.", 104.48, 45680000000, "1995", "Technology", "Industrial Machinery/Components"], [211, 0, 0, 0, "AZPN", 0, null, null, null, null, "AZPN", "Aspen Technology, Inc.", 38.4, 3390000000, "1994", "Technology", "EDP Services"], [212, 0, 0, 0, "ASFI", 0, null, null, null, null, "ASFI", "Asta Funding, Inc.", 8.46, 109860000, "1995", "Finance", "Finance Companies"], [213, 0, 0, 0, "ATEA", 0, null, null, null, null, "ATEA", "Astea International, Inc.", 1.76, 6310000, "1995", "Technology", "Computer Software: Prepackaged Software"], [214, 0, 0, 0, "ALOT", 0, null, null, null, null, "ALOT", "Astro-Med, Inc.", 14.65, 106060000, "1983", "Technology", "Computer peripheral equipment"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 88, hi: 113 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[215, 0, 0, 0, "ATAI", 0, null, null, null, null, "ATAI", "ATA Inc.", 4.15, 95640000, "2008", "Consumer Services", "Other Consumer Services"], [216, 0, 0, 0, "ATRA", 0, null, null, null, null, "ATRA", "Atara Biotherapeutics, Inc.", 18, 363830000, "2014", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [217, 0, 0, 0, "ATHN", 0, null, null, null, null, "ATHN", "athenahealth, Inc.", 134.605, 5140000000, "2007", "Miscellaneous", "Business Services"], [218, 0, 0, 0, "AFCB", 0, null, null, null, null, "AFCB", "Athens Bancshares Corporation", 24.77, 44630000, "2010", "Finance", "Savings Institutions"], [219, 0, 0, 0, "ATLC", 0, null, null, null, null, "ATLC", "Atlanticus Holdings Corporation", 2.9118, 40500000, "1995", "Finance", "Finance: Consumer Services"], [220, 0, 0, 0, "AFH", 0, null, null, null, null, "AFH", "Atlas Financial Holdings, Inc.", 17.55, 206590000, "2013", "Finance", "Property-Casualty Insurers"], [221, 0, 0, 0, "ATML", 0, null, null, null, null, "ATML", "Atmel Corporation", 8.39, 3500000000, "1991", "Technology", "Semiconductors"], [222, 0, 0, 0, "ATOS", 0, null, null, null, null, "ATOS", "Atossa Genetics Inc.", 1.67, 41020000, "2012", "Health Care", "Medical/Dental Instruments"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 95, hi: 120 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[223, 0, 0, 0, "ATRC", 0, null, null, null, null, "ATRC", "AtriCure, Inc.", 18.86, 518100000, "2005", "Health Care", "Medical/Dental Instruments"], [224, 0, 0, 0, "ATRM", 0, null, null, null, null, "ATRM", "ATRM Holdings, Inc.", 3.15, 3740000, "1993", "Capital Goods", "Electrical Products"], [225, 0, 0, 0, "ADNC", 0, null, null, null, null, "ADNC", "Audience, Inc.", 4.59, 105460000, "2012", "Technology", "Semiconductors"], [226, 0, 0, 0, "AUDC", 0, null, null, null, null, "AUDC", "AudioCodes Ltd.", 5.44, 230110000, "1999", "Public Utilities", "Telecommunications Equipment"], [227, 0, 0, 0, "EARS", 0, null, null, null, null, "EARS", "Auris Medical Holding AG", 5.88, 170250000, "2014", "Health Care", "Major Pharmaceuticals"], [228, 0, 0, 0, "ASPX", 0, null, null, null, null, "ASPX", "Auspex Pharmaceuticals, Inc.", 65.76, 2060000000, "2014", "Health Care", "Major Pharmaceuticals"], [229, 0, 0, 0, "ABTL", 0, null, null, null, null, "ABTL", "Autobytel Inc.", 9.88, 89200000, "1999", "Technology", "Computer Software: Programming, Data Processing"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 101, hi: 126 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[230, 0, 0, 0, "AVGO", 0, null, null, null, null, "AVGO", "Avago Technologies Limited", 110.15, 28120000000, "2009", "Technology", "Semiconductors"], [231, 0, 0, 0, "AAVL", 0, null, null, null, null, "AAVL", "Avalanche Biotechnologies, Inc.", 36.29, 901430000, "2014", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [232, 0, 0, 0, "AVEO", 0, null, null, null, null, "AVEO", "AVEO Pharmaceuticals, Inc.", 0.838, 43790000, "2010", "Health Care", "Major Pharmaceuticals"], [233, 0, 0, 0, "AVID", 0, null, null, null, null, "AVID", "Avid Technology, Inc.", 14.12, 553700000, "1993", "Miscellaneous", "Industrial Machinery/Components"], [234, 0, 0, 0, "AWRE", 0, null, null, null, null, "AWRE", "Aware, Inc.", 4.5, 102620000, "1996", "Technology", "Computer Software: Prepackaged Software"], [235, 0, 0, 0, "ACLS", 0, null, null, null, null, "ACLS", "Axcelis Technologies, Inc.", 2.81, 314730000, "2000", "Technology", "Industrial Machinery/Components"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 106, hi: 131 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[236, 0, 0, 0, "AXTI", 0, null, null, null, null, "AXTI", "AXT Inc", 2.55, 83730000, "1998", "Technology", "Semiconductors"], [237, 0, 0, 0, "BEAV", 0, null, null, null, null, "BEAV", "B/E Aerospace, Inc.", 62.7, 6600000000, "1990", "Consumer Durables", "Industrial Specialties"], [238, 0, 0, 0, "BIDU", 0, null, null, null, null, "BIDU", "Baidu, Inc.", 212.13, 74400000000, "2005", "Technology", "Computer Software: Programming, Data Processing"], [239, 0, 0, 0, "BANF", 0, null, null, null, null, "BANF", "BancFirst Corporation", 59.91, 927800000, "1993", "Finance", "Major Banks"], [240, 0, 0, 0, "OZRK", 0, null, null, null, null, "OZRK", "Bank of the Ozarks", 35.94, 2860000000, "1997", "Finance", "Major Banks"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 110, hi: 135 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 114, hi: 139 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[241, 0, 0, 0, "BWFG", 0, null, null, null, null, "BWFG", "Bankwell Financial Group, Inc.", 19.034, 134540000, "2014", "Finance", "Major Banks"], [242, 0, 0, 0, "BBSI", 0, null, null, null, null, "BBSI", "Barrett Business Services, Inc.", 39.78, 283100000, "1993", "Technology", "Professional Services"], [243, 0, 0, 0, "BV", 0, null, null, null, null, "BV", "Bazaarvoice, Inc.", 8.54, 671540000, "2012", "Technology", "Computer Software: Prepackaged Software"], [244, 0, 0, 0, "BCBP", 0, null, null, null, null, "BCBP", "BCB Bancorp, Inc. (NJ)", 11.7, 98130000, "2005", "Finance", "Savings Institutions"], [245, 0, 0, 0, "BECN", 0, null, null, null, null, "BECN", "Beacon Roofing Supply, Inc.", 28.08, 1390000000, "2004", "Consumer Services", "RETAIL: Building Materials"], [246, 0, 0, 0, "BBGI", 0, null, null, null, null, "BBGI", "Beasley Broadcast Group, Inc.", 5.08, 117410000, "2000", "Consumer Services", "Broadcasting"], [247, 0, 0, 0, "BEBE", 0, null, null, null, null, "BEBE", "bebe stores, inc.", 3.9, 310490000, "1998", "Consumer Non-Durables", "Apparel"], [248, 0, 0, 0, "BBBY", 0, null, null, null, null, "BBBY", "Bed Bath & Beyond Inc.", 77.91, 14460000000, "1992", "Consumer Services", "Home Furnishings"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 118, hi: 143 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 120, hi: 145 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[249, 0, 0, 0, "BLCM", 0, null, null, null, null, "BLCM", "Bellicum Pharmaceuticals, Inc.", 20, 516990000, "2014", "Health Care", "Major Pharmaceuticals"], [250, 0, 0, 0, "BNFT", 0, null, null, null, null, "BNFT", "Benefitfocus, Inc.", 21.08, 538710000, "2013", "Technology", "Computer Software: Prepackaged Software"], [251, 0, 0, 0, "BGMD", 0, null, null, null, null, "BGMD", "BG Medicine, Inc.", 0.88, 30290000, "2011", "Health Care", "Biotechnology: In Vitro & In Vivo Diagnostic Substances"], [252, 0, 0, 0, "BGFV", 0, null, null, null, null, "BGFV", "Big 5 Sporting Goods Corporation", 12.53, 277840000, "2002", "Consumer Services", "Other Specialty Stores"], [253, 0, 0, 0, "BIND", 0, null, null, null, null, "BIND", "BIND Therapeutics, Inc.", 6.06, 100280000, "2013", "Health Care", "Major Pharmaceuticals"], [254, 0, 0, 0, "ORPN", 0, null, null, null, null, "ORPN", "Bio Blast Pharma Ltd.", 7.17, 102030000, "2014", "Health Care", "Major Pharmaceuticals"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 123, hi: 148 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 125, hi: 150 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[255, 0, 0, 0, "BASI", 0, null, null, null, null, "BASI", "Bioanalytical Systems, Inc.", 2.06, 16640000, "1997", "Health Care", "Biotechnology: Commercial Physical & Biological Resarch"], [256, 0, 0, 0, "BIOC", 0, null, null, null, null, "BIOC", "Biocept, Inc.", 1.41, 6270000, "2014", "Health Care", "Medical Specialities"], [257, 0, 0, 0, "BCRX", 0, null, null, null, null, "BCRX", "BioCryst Pharmaceuticals, Inc.", 10.06, 722950000, "1994", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [258, 0, 0, 0, "BIOD", 0, null, null, null, null, "BIOD", "Biodel Inc.", 1.38, 33200000, "2007", "Health Care", "Major Pharmaceuticals"], [259, 0, 0, 0, "BMRN", 0, null, null, null, null, "BMRN", "BioMarin Pharmaceutical Inc.", 100.76, 14860000000, "1999", "Health Care", "Major Pharmaceuticals"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 127, hi: 152 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 128, hi: 153 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 129, hi: 154 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 130, hi: 155 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[260, 0, 0, 0, "BEAT", 0, null, null, null, null, "BEAT", "BioTelemetry, Inc.", 10.35, 276180000, "2008", "Health Care", "Medical/Dental Instruments"], [261, 0, 0, 0, "BDMS", 0, null, null, null, null, "BDMS", "Birner Dental Management Services, Inc.", 14.79, 27510000, "1998", "Health Care", "Medical/Nursing Services"], [262, 0, 0, 0, "BLKB", 0, null, null, null, null, "BLKB", "Blackbaud, Inc.", 44.45, 2060000000, "2004", "Technology", "Computer Software: Prepackaged Software"], [263, 0, 0, 0, "HAWK", 0, null, null, null, null, "HAWK", "Blackhawk Network Holdings, Inc.", 36.59, 1940000000, "2013", "Finance", "Finance: Consumer Services"], [264, 0, 0, 0, "BLMN", 0, null, null, null, null, "BLMN", "Bloomin&#39; Brands, Inc.", 24.45, 3070000000, "2012", "Consumer Services", "Restaurants"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 131, hi: 156 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 132, hi: 157 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 133, hi: 158 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 134, hi: 159 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 135, hi: 160 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[265, 0, 0, 0, "BHBK", 0, null, null, null, null, "BHBK", "Blue Hills Bancorp, Inc.", 12.97, 369210000, "2014", "Finance", "Major Banks"], [266, 0, 0, 0, "NILE", 0, null, null, null, null, "NILE", "Blue Nile, Inc.", 29.02, 343760000, "2004", "Consumer Services", "Consumer Specialties"], [267, 0, 0, 0, "BLUE", 0, null, null, null, null, "BLUE", "bluebird bio, Inc.", 90.69, 2610000000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [268, 0, 0, 0, "BKEP", 0, null, null, null, null, "BKEP", "Blueknight Energy Partners L.P., L.L.C.", 7.19, 235590000, "2011", "Energy", "Natural Gas Distribution"], [269, 0, 0, 0, "BOFI", 0, null, null, null, null, "BOFI", "BofI Holding, Inc.", 91.39, 1380000000, "2005", "Finance", "Savings Institutions"]] });

      expect(state.buffer.length).toEqual(45);

      // And we turn around
      state = GridDataReducer(state, { type: 'range', range: { lo: 133, hi: 158 } });
      expect(state.buffer.length).toEqual(45);

      state = GridDataReducer(state, { type: 'range', range: { lo: 124, hi: 149 } });
      expect(state.buffer.length).toEqual(45);

      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1247, rows: [
          [214, 0, 0, 0, "ALOT", 0, null, null, null, null, "ALOT", "Astro-Med, Inc.", 14.65, 106060000, "1983", "Technology", "Computer peripheral equipment"],
          [215, 0, 0, 0, "ATAI", 0, null, null, null, null, "ATAI", "ATA Inc.", 4.15, 95640000, "2008", "Consumer Services", "Other Consumer Services"],
          [216, 0, 0, 0, "ATRA", 0, null, null, null, null, "ATRA", "Atara Biotherapeutics, Inc.", 18, 363830000, "2014", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"],
          [217, 0, 0, 0, "ATHN", 0, null, null, null, null, "ATHN", "athenahealth, Inc.", 134.605, 5140000000, "2007", "Miscellaneous", "Business Services"],
          [218, 0, 0, 0, "AFCB", 0, null, null, null, null, "AFCB", "Athens Bancshares Corporation", 24.77, 44630000, "2010", "Finance", "Savings Institutions"],
          [219, 0, 0, 0, "ATLC", 0, null, null, null, null, "ATLC", "Atlanticus Holdings Corporation", 2.9118, 40500000, "1995", "Finance", "Finance: Consumer Services"],
          [220, 0, 0, 0, "AFH", 0, null, null, null, null, "AFH", "Atlas Financial Holdings, Inc.", 17.55, 206590000, "2013", "Finance", "Property-Casualty Insurers"],
          [221, 0, 0, 0, "ATML", 0, null, null, null, null, "ATML", "Atmel Corporation", 8.39, 3500000000, "1991", "Technology", "Semiconductors"],
          [222, 0, 0, 0, "ATOS", 0, null, null, null, null, "ATOS", "Atossa Genetics Inc.", 1.67, 41020000, "2012", "Health Care", "Medical/Dental Instruments"],
          [223, 0, 0, 0, "ATRC", 0, null, null, null, null, "ATRC", "AtriCure, Inc.", 18.86, 518100000, "2005", "Health Care", "Medical/Dental Instruments"],
          [224, 0, 0, 0, "ATRM", 0, null, null, null, null, "ATRM", "ATRM Holdings, Inc.", 3.15, 3740000, "1993", "Capital Goods", "Electrical Products"]
        ]
      });
      expect(state.buffer.length).toEqual(45);

      state = GridDataReducer(state, { type: 'range', range: { lo: 109, hi: 134 } });
      expect(state.buffer.length).toEqual(45);

      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[199, 0, 0, 0, "ACAT", 0, null, null, null, null, "ACAT", "Arctic Cat Inc.", 39, 504930000, "1990", "Capital Goods", "Industrial Specialties"], [200, 0, 0, 0, "ARDX", 0, null, null, null, null, "ARDX", "Ardelyx, Inc.", 17.14, 317780000, "2014", "Health Care", "Major Pharmaceuticals"], [201, 0, 0, 0, "ARNA", 0, null, null, null, null, "ARNA", "Arena Pharmaceuticals, Inc.", 4.55, 1000000000, "2000", "Health Care", "Major Pharmaceuticals"], [202, 0, 0, 0, "ARGS", 0, null, null, null, null, "ARGS", "Argos Therapeutics, Inc.", 8.35, 164120000, "2014", "Health Care", "Major Pharmaceuticals"], [203, 0, 0, 0, "ARIS", 0, null, null, null, null, "ARIS", "ARI Network Services, Inc.", 3.63, 51660000, "1991", "Technology", "Computer Software: Programming, Data Processing"], [204, 0, 0, 0, "ARIA", 0, null, null, null, null, "ARIA", "ARIAD Pharmaceuticals, Inc.", 7.35, 1380000000, "1994", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [205, 0, 0, 0, "ARTX", 0, null, null, null, null, "ARTX", "Arotech Corporation", 2.44, 59640000, "1994", "Miscellaneous", "Industrial Machinery/Components"], [206, 0, 0, 0, "ARQL", 0, null, null, null, null, "ARQL", "ArQule, Inc.", 1.35, 84740000, "1996", "Health Care", "Major Pharmaceuticals"], [207, 0, 0, 0, "ARRY", 0, null, null, null, null, "ARRY", "Array BioPharma Inc.", 8.05, 1120000000, "2000", "Health Care", "Major Pharmaceuticals"], [208, 0, 0, 0, "ARUN", 0, null, null, null, null, "ARUN", "Aruba Networks, Inc.", 17.7, 1940000000, "2007", "Technology", "Computer peripheral equipment"], [209, 0, 0, 0, "ASBB", 0, null, null, null, null, "ASBB", "ASB Bancorp, Inc.", 19.9, 87130000, "2011", "Finance", "Savings Institutions"], [210, 0, 0, 0, "ASML", 0, null, null, null, null, "ASML", "ASML Holding N.V.", 104.48, 45680000000, "1995", "Technology", "Industrial Machinery/Components"], [211, 0, 0, 0, "AZPN", 0, null, null, null, null, "AZPN", "Aspen Technology, Inc.", 38.4, 3390000000, "1994", "Technology", "EDP Services"], [212, 0, 0, 0, "ASFI", 0, null, null, null, null, "ASFI", "Asta Funding, Inc.", 8.46, 109860000, "1995", "Finance", "Finance Companies"], [213, 0, 0, 0, "ATEA", 0, null, null, null, null, "ATEA", "Astea International, Inc.", 1.76, 6310000, "1995", "Technology", "Computer Software: Prepackaged Software"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 94, hi: 119 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[184, 0, 0, 0, "ANGI", 0, null, null, null, null, "ANGI", "Angie&#39;s List, Inc.", 5.02, 293750000, "2011", "Consumer Services", "Advertising"], [185, 0, 0, 0, "ANGO", 0, null, null, null, null, "ANGO", "AngioDynamics, Inc.", 18.78, 672720000, "2004", "Health Care", "Medical/Dental Instruments"], [186, 0, 0, 0, "ANSS", 0, null, null, null, null, "ANSS", "ANSYS, Inc.", 86.26, 7930000000, "1996", "Technology", "Computer Software: Prepackaged Software"], [187, 0, 0, 0, "ANTH", 0, null, null, null, null, "ANTH", "Anthera Pharmaceuticals, Inc.", 3.84, 88090000, "2010", "Health Care", "Major Pharmaceuticals"], [188, 0, 0, 0, "APOL", 0, null, null, null, null, "APOL", "Apollo Education Group, Inc.", 25.97, 2810000000, "1994", "Consumer Services", "Other Consumer Services"], [189, 0, 0, 0, "AAPL", 0, null, null, null, null, "AAPL", "Apple Inc.", 127.08, 740210000000, "1980", "Technology", "Computer Manufacturing"], [190, 0, 0, 0, "AGTC", 0, null, null, null, null, "AGTC", "Applied Genetic Technologies Corporation", 24.49, 401900000, "2014", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [191, 0, 0, 0, "AMAT", 0, null, null, null, null, "AMAT", "Applied Materials, Inc.", 24.12, 29460000000, "1972", "Technology", "Semiconductors"], [192, 0, 0, 0, "AMCC", 0, null, null, null, null, "AMCC", "Applied Micro Circuits Corporation", 5.21, 412320000, "1997", "Technology", "Semiconductors"], [193, 0, 0, 0, "AAOI", 0, null, null, null, null, "AAOI", "Applied Optoelectronics, Inc.", 10.15, 150380000, "2013", "Technology", "Semiconductors"], [194, 0, 0, 0, "AREX", 0, null, null, null, null, "AREX", "Approach Resources Inc.", 8.15, 322380000, "2007", "Energy", "Oil & Gas Production"], [195, 0, 0, 0, "AQXP", 0, null, null, null, null, "AQXP", "Aquinox Pharmaceuticals, Inc.", 10.29, 110050000, "2014", "Health Care", "Major Pharmaceuticals"], [196, 0, 0, 0, "AUMA", 0, null, null, null, null, "AUMA", "AR Capital Acquisition Corp.", 9.75, 292500000, "2014", "Finance", "Business Services"], [197, 0, 0, 0, "ARDM", 0, null, null, null, null, "ARDM", "Aradigm Corporation", 7.66, 112810000, "1996", "Health Care", "Biotechnology: Electromedical & Electrotherapeutic Apparatus"], [198, 0, 0, 0, "PETX", 0, null, null, null, null, "PETX", "Aratana Therapeutics, Inc.", 16.52, 573330000, "2013", "Health Care", "Major Pharmaceuticals"]] });


      state = GridDataReducer(state, { type: 'range', range: { lo: 82, hi: 107 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[172, 0, 0, 0, "AMSF", 0, null, null, null, null, "AMSF", "AMERISAFE, Inc.", 43.7, 822560000, "2005", "Finance", "Property-Casualty Insurers"], [173, 0, 0, 0, "AMGN", 0, null, null, null, null, "AMGN", "Amgen Inc.", 153.48, 116750000000, "1983", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [174, 0, 0, 0, "FOLD", 0, null, null, null, null, "FOLD", "Amicus Therapeutics, Inc.", 8.36, 796280000, "2007", "Health Care", "Major Pharmaceuticals"], [175, 0, 0, 0, "AMKR", 0, null, null, null, null, "AMKR", "Amkor Technology, Inc.", 8.9, 2110000000, "1998", "Technology", "Semiconductors"], [176, 0, 0, 0, "AMPH", 0, null, null, null, null, "AMPH", "Amphastar Pharmaceuticals, Inc.", 12.76, 569720000, "2014", "Health Care", "Major Pharmaceuticals"], [177, 0, 0, 0, "AMRS", 0, null, null, null, null, "AMRS", "Amyris, Inc.", 2.09, 165270000, "2010", "Basic Industries", "Major Chemicals"], [178, 0, 0, 0, "ANAC", 0, null, null, null, null, "ANAC", "Anacor Pharmaceuticals, Inc.", 40.76, 1750000000, "2010", "Health Care", "Major Pharmaceuticals"], [179, 0, 0, 0, "ANAD", 0, null, null, null, null, "ANAD", "ANADIGICS, Inc.", 1.26, 109090000, "1995", "Technology", "Semiconductors"], [180, 0, 0, 0, "ALOG", 0, null, null, null, null, "ALOG", "Analogic Corporation", 86.55, 1070000000, "1972", "Capital Goods", "Electrical Products"], [181, 0, 0, 0, "ANCB", 0, null, null, null, null, "ANCB", "Anchor Bancorp", 22.14, 56460000, "2011", "Finance", "Banks"], [182, 0, 0, 0, "ABCW", 0, null, null, null, null, "ABCW", "Anchor BanCorp Wisconsin Inc.", 33.49, 309630000, "2014", "Finance", "Banks"], [183, 0, 0, 0, "AMCF", 0, null, null, null, null, "AMCF", "Andatee China Marine Fuel Services Corporation", 1.44, 14770000, "2010", "Energy", "Oil Refining/Marketing"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 70, hi: 95 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[160, 0, 0, 0, "AIMC", 0, null, null, null, null, "AIMC", "Altra Industrial Motion Corp.", 27.85, 741790000, "2006", "Capital Goods", "Industrial Machinery/Components"], [161, 0, 0, 0, "AMZN", 0, null, null, null, null, "AMZN", "Amazon.com, Inc.", 381.83, 177320000000, "1997", "Consumer Services", "Catalog/Specialty Distribution"], [162, 0, 0, 0, "AMBA", 0, null, null, null, null, "AMBA", "Ambarella, Inc.", 50.71, 1540000000, "2012", "Technology", "Semiconductors"], [163, 0, 0, 0, "AMDA", 0, null, null, null, null, "AMDA", "Amedica Corporation", 0.65, 8970000, "2014", "Health Care", "Medical/Dental Instruments"], [164, 0, 0, 0, "AGNC", 0, null, null, null, null, "AGNC", "American Capital Agency Corp.", 21.95, 7740000000, "2008", "Consumer Services", "Real Estate Investment Trusts"], [165, 0, 0, 0, "MTGE", 0, null, null, null, null, "MTGE", "American Capital Mortgage Investment Corp.", 18.33, 937430000, "2011", "Consumer Services", "Real Estate Investment Trusts"], [166, 0, 0, 0, "APEI", 0, null, null, null, null, "APEI", "American Public Education, Inc.", 34.36, 593210000, "2007", "Consumer Services", "Other Consumer Services"], [167, 0, 0, 0, "ARII", 0, null, null, null, null, "ARII", "American Railcar Industries, Inc.", 54.26, 1160000000, "2006", "Capital Goods", "Railroads"], [168, 0, 0, 0, "ARCP", 0, null, null, null, null, "ARCP", "American Realty Capital Properties, Inc.", 9.4, 8540000000, "2011", "Consumer Services", "Real Estate Investment Trusts"], [169, 0, 0, 0, "AMSC", 0, null, null, null, null, "AMSC", "American Superconductor Corporation", 0.7999, 76570000, "1991", "Consumer Durables", "Metal Fabrications"], [170, 0, 0, 0, "AMWD", 0, null, null, null, null, "AMWD", "American Woodmark Corporation", 43.98, 696160000, "1986", "Basic Industries", "Forest Products"], [171, 0, 0, 0, "ABCB", 0, null, null, null, null, "ABCB", "Ameris Bancorp", 25.75, 725140000, "1994", "Finance", "Major Banks"]] });

      state = GridDataReducer(state, { type: 'range', range: { lo: 60, hi: 85 } });

      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: [[150, 0, 0, 0, "AFOP", 0, null, null, null, null, "AFOP", "Alliance Fiber Optic Products, Inc.", 16.51, 307950000, "2000", "Technology", "Semiconductors"], [151, 0, 0, 0, "AIQ", 0, null, null, null, null, "AIQ", "Alliance HealthCare Services, Inc.", 24.99, 268250000, "2001", "Health Care", "Medical Specialities"], [152, 0, 0, 0, "AHGP", 0, null, null, null, null, "AHGP", "Alliance Holdings GP, L.P.", 53, 3170000000, "2006", "Energy", "Coal Mining"], [153, 0, 0, 0, "ARLP", 0, null, null, null, null, "ARLP", "Alliance Resource Partners, L.P.", 39.29, 2910000000, "1999", "Energy", "Coal Mining"], [154, 0, 0, 0, "AHPI", 0, null, null, null, null, "AHPI", "Allied Healthcare Products, Inc.", 1.56, 12520000, "1992", "Health Care", "Industrial Specialties"], [155, 0, 0, 0, "ALLT", 0, null, null, null, null, "ALLT", "Allot Communications Ltd.", 9.15, 304210000, "2006", "Technology", "Computer Communications Equipment"], [156, 0, 0, 0, "ALNY", 0, null, null, null, null, "ALNY", "Alnylam Pharmaceuticals, Inc.", 95.54, 7830000000, "2004", "Health Care", "Major Pharmaceuticals"], [157, 0, 0, 0, "AOSL", 0, null, null, null, null, "AOSL", "Alpha and Omega Semiconductor Limited", 9.05, 241240000, "2010", "Technology", "Semiconductors"], [158, 0, 0, 0, "ATEC", 0, null, null, null, null, "ATEC", "Alphatec Holdings, Inc.", 1.34, 133460000, "2006", "Health Care", "Medical/Dental Instruments"], [159, 0, 0, 0, "ALTR", 0, null, null, null, null, "ALTR", "Altera Corporation", 35.66, 10870000000, "1988", "Technology", "Semiconductors"]] });

      // check keys are unique
      expect(uniqueKeys(state.rows)).toEqual(true);

    })

    test('short forward scroll burst, then back, before data refresh', () => {

      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 10, range: { lo: 0, hi: 25 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [100, 0, 0, 0, "TFSC", 0, null, null, null, null, "TFSC", "1347 Capital Corp.", 9.4345671, 56090000, "2014", "Finance", "Business Services"],
          [101, 0, 0, 0, "PIH", 0, null, null, null, null, "PIH", "1347 Property Insurance Holdings, Inc.", 7.6400987, 48580000, "2014", "Finance", "Property-Casualty Insurers"],
          [102, 0, 0, 0, "FLWS", 0, null, null, null, null, "FLWS", "1-800 FLOWERS.COM, Inc.", 10.3300001, 668420000, "1999", "Consumer Services", "Other Specialty Stores"],
          [103, 0, 0, 0, "VNET", 0, null, null, null, null, "VNET", "21Vianet Group, Inc.", 19.05, 1250000000, "2011", "Technology", "Computer Software: Programming, Data Processing"],
          [104, 0, 0, 0, "TWOU", 0, null, null, null, null, "TWOU", "2U, Inc.", 17.11, 693670000, "2014", "Technology", "Computer Software: Prepackaged Software"],
          [105, 0, 0, 0, "JOBS", 0, null, null, null, null, "JOBS", "51job, Inc.", 34.86, 2060000000, "2004", "Technology", "Diversified Commercial Services"],
          [106, 0, 0, 0, "SHLM", 0, null, null, null, null, "SHLM", "A. Schulman, Inc.", 39.83, 1160000000, "1972", "Basic Industries", "Major Chemicals"],
          [107, 0, 0, 0, "ABAX", 0, null, null, null, null, "ABAX", "ABAXIS, Inc.", 60.93, 1370000000, "1992", "Capital Goods", "Industrial Machinery/Components"],
          [108, 0, 0, 0, "ABY", 0, null, null, null, null, "ABY", "Abengoa Yield plc", 34.4, 2750000000, "2014", "Public Utilities", "Electric Utilities: Central"],
          [109, 0, 0, 0, "ABGB", 0, null, null, null, null, "ABGB", "Abengoa, S.A.", 15.52, 2610000000, "2013", "Consumer Services", "Military/Government/Technical"],
          [110, 0, 0, 0, "ACAD", 0, null, null, null, null, "ACAD", "ACADIA Pharmaceuticals Inc.", 34.21, 3410000000, "1985", "Health Care", "Major Pharmaceuticals"],
          [111, 0, 0, 0, "XLRN", 0, null, null, null, null, "XLRN", "Acceleron Pharma Inc.", 38.02, 1230000000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"],
          [112, 0, 0, 0, "ARAY", 0, null, null, null, null, "ARAY", "Accuray Incorporated", 8, 627920000, "2007", "Health Care", "Medical/Dental Instruments"], [113, 0, 0, 0, "ACRX", 0, null, null, null, null, "ACRX", "AcelRx Pharmaceuticals, Inc.", 7.29, 318630000, "2011", "Health Care", "Major Pharmaceuticals"], [114, 0, 0, 0, "AKAO", 0, null, null, null, null, "AKAO", "Achaogen, Inc.", 11.11, 197290000, "2014", "Health Care", "Major Pharmaceuticals"], [115, 0, 0, 0, "ACHN", 0, null, null, null, null, "ACHN", "Achillion Pharmaceuticals, Inc.", 10.89, 1090000000, "2006", "Health Care", "Major Pharmaceuticals"], [116, 0, 0, 0, "ACOR", 0, null, null, null, null, "ACOR", "Acorda Therapeutics, Inc.", 36.14, 1520000000, "2006", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [117, 0, 0, 0, "ACTS", 0, null, null, null, null, "ACTS", "Actions Semiconductor Co., Ltd.", 1.54, 132440000, "2005", "Technology", "Semiconductors"], [118, 0, 0, 0, "ACPW", 0, null, null, null, null, "ACPW", "Active Power, Inc.", 1.86, 42950000, "2000", "Public Utilities", "Electric Utilities: Central"], [119, 0, 0, 0, "ADMS", 0, null, null, null, null, "ADMS", "Adamas Pharmaceuticals, Inc.", 16.98, 290800000, "2014", "Health Care", "Major Pharmaceuticals"], [120, 0, 0, 0, "ADUS", 0, null, null, null, null, "ADUS", "Addus HomeCare Corporation", 21.57, 237050000, "2009", "Health Care", "Medical/Nursing Services"], [121, 0, 0, 0, "ADBE", 0, null, null, null, null, "ADBE", "Adobe Systems Incorporated", 76.51, 38130000000, "1986", "Technology", "Computer Software: Prepackaged Software"], [122, 0, 0, 0, "ADTN", 0, null, null, null, null, "ADTN", "ADTRAN, Inc.", 23.11, 1260000000, "1994", "Public Utilities", "Telecommunications Equipment"], [123, 0, 0, 0, "AEIS", 0, null, null, null, null, "AEIS", "Advanced Energy Industries, Inc.", 26.68, 1070000000, "1995", "Capital Goods", "Industrial Machinery/Components"], [124, 0, 0, 0, "ADVS", 0, null, null, null, null, "ADVS", "Advent Software, Inc.", 44.18, 2280000000, "1995", "Technology", "EDP Services"], [125, 0, 0, 0, "AEGR", 0, null, null, null, null, "AEGR", "Aegerion Pharmaceuticals, Inc.", 25.15, 715170000, "2010", "Health Care", "Major Pharmaceuticals"], [126, 0, 0, 0, "AEHR", 0, null, null, null, null, "AEHR", "Aehr Test Systems", 2.47, 31300000, "1997", "Capital Goods", "Electrical Products"], [127, 0, 0, 0, "AEPI", 0, null, null, null, null, "AEPI", "AEP Industries Inc.", 49.71, 252560000, "1986", "Capital Goods", "Specialty Chemicals"], [128, 0, 0, 0, "AERI", 0, null, null, null, null, "AERI", "Aerie Pharmaceuticals, Inc.", 27.91, 669410000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [129, 0, 0, 0, "AVAV", 0, null, null, null, null, "AVAV", "AeroVironment, Inc.", 26.86, 626430000, "2007", "Capital Goods", "Aerospace"], [130, 0, 0, 0, "AFMD", 0, null, null, null, null, "AFMD", "Affimed N.V.", 5.7, 136710000, "2014", "Health Care", "Major Pharmaceuticals"], [131, 0, 0, 0, "AFFX", 0, null, null, null, null, "AFFX", "Affymetrix, Inc.", 11.45, 842530000, "1996", "Capital Goods", "Biotechnology: Laboratory Analytical Instruments"], [132, 0, 0, 0, "AGEN", 0, null, null, null, null, "AGEN", "Agenus Inc.", 5.03, 315300000, "2000", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [133, 0, 0, 0, "AGRX", 0, null, null, null, null, "AGRX", "Agile Therapeutics, Inc.", 8.57, 171500000, "2014", "Health Care", "Major Pharmaceuticals"],
          [134, 0, 0, 0, "AGIO", 0, null, null, null, null, "AGIO", "Agios Pharmaceuticals, Inc.", 118.55, 4380000000, "2013", "Health Care", "Major Pharmaceuticals"]
        ]
      });

      state = GridDataReducer(state, { type: 'range', range: { lo: 4, hi: 29 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 9, hi: 34 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [135, 0, 0, 0, "AMCN", 0, null, null, null, null, "AMCN", "AirMedia Group Inc", 2.28, 135810000, "2007", "Technology", "Advertising"], [136, 0, 0, 0, "AKAM", 0, null, null, null, null, "AKAM", "Akamai Technologies, Inc.", 68.77, 12240000000, "1999", "Miscellaneous", "Business Services"], [137, 0, 0, 0, "AKBA", 0, null, null, null, null, "AKBA", "Akebia Therapeutics, Inc.", 9.32, 189580000, "2014", "Health Care", "Major Pharmaceuticals"], [138, 0, 0, 0, "AKER", 0, null, null, null, null, "AKER", "Akers Biosciences Inc", 3.5, 17340000, "2014", "Health Care", "Biotechnology: In Vitro & In Vivo Diagnostic Substances"], [139, 0, 0, 0, "ALSK", 0, null, null, null, null, "ALSK", "Alaska Communications Systems Group, Inc.", 1.75, 86690000, "1999", "Public Utilities", "Telecommunications Equipment"], [140, 0, 0, 0, "AMRI", 0, null, null, null, null, "AMRI", "Albany Molecular Research, Inc.", 16.94, 552360000, "1999", "Health Care", "Biotechnology: Commercial Physical & Biological Resarch"], [141, 0, 0, 0, "ADHD", 0, null, null, null, null, "ADHD", "Alcobra Ltd.", 6.92, 146550000, "2013", "Health Care", "Major Pharmaceuticals"], [142, 0, 0, 0, "ALDR", 0, null, null, null, null, "ALDR", "Alder BioPharmaceuticals, Inc.", 26.06, 982630000, "2014", "Health Care", "Major Pharmaceuticals"], [143, 0, 0, 0, "ALDX", 0, null, null, null, null, "ALDX", "Aldeyra Therapeutics, Inc.", 11.01, 61280000, "2014", "Health Care", "Major Pharmaceuticals"]
        ]
      });

      state = GridDataReducer(state, { type: 'range', range: { lo: 16, hi: 41 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [144, 0, 0, 0, "ALXN", 0, null, null, null, null, "ALXN", "Alexion Pharmaceuticals, Inc.", 182.29, 36850000000, "1996", "Health Care", "Major Pharmaceuticals"], [145, 0, 0, 0, "ALXA", 0, null, null, null, null, "ALXA", "Alexza Pharmaceuticals, Inc.", 2.07, 40170000, "2006", "Health Care", "Major Pharmaceuticals"], [146, 0, 0, 0, "ALGN", 0, null, null, null, null, "ALGN", "Align Technology, Inc.", 56.9, 4570000000, "2001", "Health Care", "Industrial Specialties"], [147, 0, 0, 0, "ALIM", 0, null, null, null, null, "ALIM", "Alimera Sciences, Inc.", 5.16, 228570000, "2010", "Health Care", "Major Pharmaceuticals"], [148, 0, 0, 0, "ALKS", 0, null, null, null, null, "ALKS", "Alkermes plc", 71.4, 10440000000, "1991", "Health Care", "Major Pharmaceuticals"], [149, 0, 0, 0, "ALGT", 0, null, null, null, null, "ALGT", "Allegiant Travel Company", 178.42, 3120000000, "2006", "Transportation", "Air Freight/Delivery Services"], [150, 0, 0, 0, "AFOP", 0, null, null, null, null, "AFOP", "Alliance Fiber Optic Products, Inc.", 16.51, 307950000, "2000", "Technology", "Semiconductors"]
        ]
      });

      state = GridDataReducer(state, { type: 'range', range: { lo: 22, hi: 47 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [151, 0, 0, 0, "AIQ", 0, null, null, null, null, "AIQ", "Alliance HealthCare Services, Inc.", 24.99, 268250000, "2001", "Health Care", "Medical Specialities"], [152, 0, 0, 0, "AHGP", 0, null, null, null, null, "AHGP", "Alliance Holdings GP, L.P.", 53, 3170000000, "2006", "Energy", "Coal Mining"], [153, 0, 0, 0, "ARLP", 0, null, null, null, null, "ARLP", "Alliance Resource Partners, L.P.", 39.29, 2910000000, "1999", "Energy", "Coal Mining"], [154, 0, 0, 0, "AHPI", 0, null, null, null, null, "AHPI", "Allied Healthcare Products, Inc.", 1.56, 12520000, "1992", "Health Care", "Industrial Specialties"], [155, 0, 0, 0, "ALLT", 0, null, null, null, null, "ALLT", "Allot Communications Ltd.", 9.15, 304210000, "2006", "Technology", "Computer Communications Equipment"], [156, 0, 0, 0, "ALNY", 0, null, null, null, null, "ALNY", "Alnylam Pharmaceuticals, Inc.", 95.54, 7830000000, "2004", "Health Care", "Major Pharmaceuticals"]
        ]
      });

      state = GridDataReducer(state, { type: 'range', range: { lo: 26, hi: 51 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 28, hi: 53 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [157, 0, 0, 0, "AOSL", 0, null, null, null, null, "AOSL", "Alpha and Omega Semiconductor Limited", 9.05, 241240000, "2010", "Technology", "Semiconductors"], [158, 0, 0, 0, "ATEC", 0, null, null, null, null, "ATEC", "Alphatec Holdings, Inc.", 1.34, 133460000, "2006", "Health Care", "Medical/Dental Instruments"], [159, 0, 0, 0, "ALTR", 0, null, null, null, null, "ALTR", "Altera Corporation", 35.66, 10870000000, "1988", "Technology", "Semiconductors"], [160, 0, 0, 0, "AIMC", 0, null, null, null, null, "AIMC", "Altra Industrial Motion Corp.", 27.85, 741790000, "2006", "Capital Goods", "Industrial Machinery/Components"], [161, 0, 0, 0, "AMZN", 0, null, null, null, null, "AMZN", "Amazon.com, Inc.", 381.83, 177320000000, "1997", "Consumer Services", "Catalog/Specialty Distribution"],
          [162, 0, 0, 0, "AMBA", 0, null, null, null, null, "AMBA", "Ambarella, Inc.", 50.71, 1540000000, "2012", "Technology", "Semiconductors"]
        ]
      });

      expect(state.buffer.length).toEqual(45)
      expect(state.bufferIdx).toEqual({ lo: 10, hi: 35 });

      state = GridDataReducer(state, { type: 'range', range: { lo: 29, hi: 54 } });
      expect(state.dataRequired).toEqual(false);
      expect(state.buffer.length).toEqual(45);
      expect(state.bufferIdx).toEqual({ lo: 11, hi: 36 });

      state = GridDataReducer(state, { type: 'range', range: { lo: 30, hi: 55 } });
      expect(state.dataRequired).toEqual(false);
      expect(state.buffer.length).toEqual(45)
      expect(state.bufferIdx).toEqual({ lo: 12, hi: 37 });

      // Turn back

      state = GridDataReducer(state, { type: 'range', range: { lo: 28, hi: 53 } });
      expect(state.dataRequired).toEqual(false);
      expect(state.buffer.length).toEqual(45)
      expect(state.bufferIdx).toEqual({ lo: 10, hi: 35 });

      state = GridDataReducer(state, { type: 'range', range: { lo: 21, hi: 46 } });
      expect(state.dataRequired).toEqual(true);
      expect(state.buffer.length).toEqual(45)
      expect(state.bufferIdx).toEqual({ lo: 3, hi: 28 });


      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [111, 0, 0, 0, "XLRN", 0, null, null, null, null, "XLRN", "Acceleron Pharma Inc.", 38.02, 1230000000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"],
          [112, 0, 0, 0, "ARAY", 0, null, null, null, null, "ARAY", "Accuray Incorporated", 8, 627920000, "2007", "Health Care", "Medical/Dental Instruments"],
          [113, 0, 0, 0, "ACRX", 0, null, null, null, null, "ACRX", "AcelRx Pharmaceuticals, Inc.", 7.29, 318630000, "2011", "Health Care", "Major Pharmaceuticals"],
          [114, 0, 0, 0, "AKAO", 0, null, null, null, null, "AKAO", "Achaogen, Inc.", 11.11, 197290000, "2014", "Health Care", "Major Pharmaceuticals"],
          [115, 0, 0, 0, "ACHN", 0, null, null, null, null, "ACHN", "Achillion Pharmaceuticals, Inc.", 10.89, 1090000000, "2006", "Health Care", "Major Pharmaceuticals"],
          [116, 0, 0, 0, "ACOR", 0, null, null, null, null, "ACOR", "Acorda Therapeutics, Inc.", 36.14, 1520000000, "2006", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"],
          [117, 0, 0, 0, "ACTS", 0, null, null, null, null, "ACTS", "Actions Semiconductor Co., Ltd.", 1.54, 132440000, "2005", "Technology", "Semiconductors"]
        ]
      });

      state = GridDataReducer(state, { type: 'range', range: { lo: 11, hi: 36 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [101, 0, 0, 0, "PIH", 0, null, null, null, null, "PIH", "1347 Property Insurance Holdings, Inc.", 7.6400987, 48580000, "2014", "Finance", "Property-Casualty Insurers"], [102, 0, 0, 0, "FLWS", 0, null, null, null, null, "FLWS", "1-800 FLOWERS.COM, Inc.", 10.3300001, 668420000, "1999", "Consumer Services", "Other Specialty Stores"], [103, 0, 0, 0, "VNET", 0, null, null, null, null, "VNET", "21Vianet Group, Inc.", 19.05, 1250000000, "2011", "Technology", "Computer Software: Programming, Data Processing"], [104, 0, 0, 0, "TWOU", 0, null, null, null, null, "TWOU", "2U, Inc.", 17.11, 693670000, "2014", "Technology", "Computer Software: Prepackaged Software"], [105, 0, 0, 0, "JOBS", 0, null, null, null, null, "JOBS", "51job, Inc.", 34.86, 2060000000, "2004", "Technology", "Diversified Commercial Services"], [106, 0, 0, 0, "SHLM", 0, null, null, null, null, "SHLM", "A. Schulman, Inc.", 39.83, 1160000000, "1972", "Basic Industries", "Major Chemicals"], [107, 0, 0, 0, "ABAX", 0, null, null, null, null, "ABAX", "ABAXIS, Inc.", 60.93, 1370000000, "1992", "Capital Goods", "Industrial Machinery/Components"], [108, 0, 0, 0, "ABY", 0, null, null, null, null, "ABY", "Abengoa Yield plc", 34.4, 2750000000, "2014", "Public Utilities", "Electric Utilities: Central"], [109, 0, 0, 0, "ABGB", 0, null, null, null, null, "ABGB", "Abengoa, S.A.", 15.52, 2610000000, "2013", "Consumer Services", "Military/Government/Technical"], [110, 0, 0, 0, "ACAD", 0, null, null, null, null, "ACAD", "ACADIA Pharmaceuticals Inc.", 34.21, 3410000000, "1985", "Health Care", "Major Pharmaceuticals"]
        ]
      });


      state = GridDataReducer(state, { type: 'range', range: { lo: 2, hi: 27 } });
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [100, 0, 0, 0, "TFSC", 0, null, null, null, null, "TFSC", "1347 Capital Corp.", 9.4345671, 56090000, "2014", "Finance", "Business Services"]
        ]
      });


    })

  });

  test('from top, scroll  FWD out of viewport, then back to top, then FWD', () => {
    let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 10, range: { lo: 0, hi: 25 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1000, rows: [
        [100, 0, 0, 0, "TFSC", 0, null, null, null, null, "TFSC", "1347 Capital Corp.", 9.4345671, 56090000, "2014", "Finance", "Business Services"],
        [101, 0, 0, 0, "PIH", 0, null, null, null, null, "PIH", "1347 Property Insurance Holdings, Inc.", 7.6400987, 48580000, "2014", "Finance", "Property-Casualty Insurers"],
        [102, 0, 0, 0, "FLWS", 0, null, null, null, null, "FLWS", "1-800 FLOWERS.COM, Inc.", 10.3300001, 668420000, "1999", "Consumer Services", "Other Specialty Stores"],
        [103, 0, 0, 0, "VNET", 0, null, null, null, null, "VNET", "21Vianet Group, Inc.", 19.05, 1250000000, "2011", "Technology", "Computer Software: Programming, Data Processing"],
        [104, 0, 0, 0, "TWOU", 0, null, null, null, null, "TWOU", "2U, Inc.", 17.11, 693670000, "2014", "Technology", "Computer Software: Prepackaged Software"],
        [105, 0, 0, 0, "JOBS", 0, null, null, null, null, "JOBS", "51job, Inc.", 34.86, 2060000000, "2004", "Technology", "Diversified Commercial Services"],
        [106, 0, 0, 0, "SHLM", 0, null, null, null, null, "SHLM", "A. Schulman, Inc.", 39.83, 1160000000, "1972", "Basic Industries", "Major Chemicals"],
        [107, 0, 0, 0, "ABAX", 0, null, null, null, null, "ABAX", "ABAXIS, Inc.", 60.93, 1370000000, "1992", "Capital Goods", "Industrial Machinery/Components"],
        [108, 0, 0, 0, "ABY", 0, null, null, null, null, "ABY", "Abengoa Yield plc", 34.4, 2750000000, "2014", "Public Utilities", "Electric Utilities: Central"],
        [109, 0, 0, 0, "ABGB", 0, null, null, null, null, "ABGB", "Abengoa, S.A.", 15.52, 2610000000, "2013", "Consumer Services", "Military/Government/Technical"],
        [110, 0, 0, 0, "ACAD", 0, null, null, null, null, "ACAD", "ACADIA Pharmaceuticals Inc.", 34.21, 3410000000, "1985", "Health Care", "Major Pharmaceuticals"],
        [111, 0, 0, 0, "XLRN", 0, null, null, null, null, "XLRN", "Acceleron Pharma Inc.", 38.02, 1230000000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"],
        [112, 0, 0, 0, "ARAY", 0, null, null, null, null, "ARAY", "Accuray Incorporated", 8, 627920000, "2007", "Health Care", "Medical/Dental Instruments"], [113, 0, 0, 0, "ACRX", 0, null, null, null, null, "ACRX", "AcelRx Pharmaceuticals, Inc.", 7.29, 318630000, "2011", "Health Care", "Major Pharmaceuticals"], [114, 0, 0, 0, "AKAO", 0, null, null, null, null, "AKAO", "Achaogen, Inc.", 11.11, 197290000, "2014", "Health Care", "Major Pharmaceuticals"], [115, 0, 0, 0, "ACHN", 0, null, null, null, null, "ACHN", "Achillion Pharmaceuticals, Inc.", 10.89, 1090000000, "2006", "Health Care", "Major Pharmaceuticals"], [116, 0, 0, 0, "ACOR", 0, null, null, null, null, "ACOR", "Acorda Therapeutics, Inc.", 36.14, 1520000000, "2006", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [117, 0, 0, 0, "ACTS", 0, null, null, null, null, "ACTS", "Actions Semiconductor Co., Ltd.", 1.54, 132440000, "2005", "Technology", "Semiconductors"], [118, 0, 0, 0, "ACPW", 0, null, null, null, null, "ACPW", "Active Power, Inc.", 1.86, 42950000, "2000", "Public Utilities", "Electric Utilities: Central"], [119, 0, 0, 0, "ADMS", 0, null, null, null, null, "ADMS", "Adamas Pharmaceuticals, Inc.", 16.98, 290800000, "2014", "Health Care", "Major Pharmaceuticals"], [120, 0, 0, 0, "ADUS", 0, null, null, null, null, "ADUS", "Addus HomeCare Corporation", 21.57, 237050000, "2009", "Health Care", "Medical/Nursing Services"], [121, 0, 0, 0, "ADBE", 0, null, null, null, null, "ADBE", "Adobe Systems Incorporated", 76.51, 38130000000, "1986", "Technology", "Computer Software: Prepackaged Software"], [122, 0, 0, 0, "ADTN", 0, null, null, null, null, "ADTN", "ADTRAN, Inc.", 23.11, 1260000000, "1994", "Public Utilities", "Telecommunications Equipment"], [123, 0, 0, 0, "AEIS", 0, null, null, null, null, "AEIS", "Advanced Energy Industries, Inc.", 26.68, 1070000000, "1995", "Capital Goods", "Industrial Machinery/Components"], [124, 0, 0, 0, "ADVS", 0, null, null, null, null, "ADVS", "Advent Software, Inc.", 44.18, 2280000000, "1995", "Technology", "EDP Services"], [125, 0, 0, 0, "AEGR", 0, null, null, null, null, "AEGR", "Aegerion Pharmaceuticals, Inc.", 25.15, 715170000, "2010", "Health Care", "Major Pharmaceuticals"], [126, 0, 0, 0, "AEHR", 0, null, null, null, null, "AEHR", "Aehr Test Systems", 2.47, 31300000, "1997", "Capital Goods", "Electrical Products"], [127, 0, 0, 0, "AEPI", 0, null, null, null, null, "AEPI", "AEP Industries Inc.", 49.71, 252560000, "1986", "Capital Goods", "Specialty Chemicals"], [128, 0, 0, 0, "AERI", 0, null, null, null, null, "AERI", "Aerie Pharmaceuticals, Inc.", 27.91, 669410000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [129, 0, 0, 0, "AVAV", 0, null, null, null, null, "AVAV", "AeroVironment, Inc.", 26.86, 626430000, "2007", "Capital Goods", "Aerospace"], [130, 0, 0, 0, "AFMD", 0, null, null, null, null, "AFMD", "Affimed N.V.", 5.7, 136710000, "2014", "Health Care", "Major Pharmaceuticals"], [131, 0, 0, 0, "AFFX", 0, null, null, null, null, "AFFX", "Affymetrix, Inc.", 11.45, 842530000, "1996", "Capital Goods", "Biotechnology: Laboratory Analytical Instruments"], 
        [132, 0, 0, 0, "AGEN", 0, null, null, null, null, "AGEN", "Agenus Inc.", 5.03, 315300000, "2000", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], 
        [133, 0, 0, 0, "AGRX", 0, null, null, null, null, "AGRX", "Agile Therapeutics, Inc.", 8.57, 171500000, "2014", "Health Care", "Major Pharmaceuticals"],
        [134, 0, 0, 0, "AGIO", 0, null, null, null, null, "AGIO", "Agios Pharmaceuticals, Inc.", 118.55, 4380000000, "2013", "Health Care", "Major Pharmaceuticals"]]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 6, hi: 31 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [135, 0, 0, 0, "AMCN", 0, null, null, null, null, "AMCN", "AirMedia Group Inc", 2.28, 135810000, "2007", "Technology", "Advertising"], 
        [136, 0, 0, 0, "AKAM", 0, null, null, null, null, "AKAM", "Akamai Technologies, Inc.", 68.77, 12240000000, "1999", "Miscellaneous", "Business Services"], 
        [137, 0, 0, 0, "AKBA", 0, null, null, null, null, "AKBA", "Akebia Therapeutics, Inc.", 9.32, 189580000, "2014", "Health Care", "Major Pharmaceuticals"], 
        [138, 0, 0, 0, "AKER", 0, null, null, null, null, "AKER", "Akers Biosciences Inc", 3.5, 17340000, "2014", "Health Care", "Biotechnology: In Vitro & In Vivo Diagnostic Substances"], 
        [139, 0, 0, 0, "ALSK", 0, null, null, null, null, "ALSK", "Alaska Communications Systems Group, Inc.", 1.75, 86690000, "1999", "Public Utilities", "Telecommunications Equipment"], 
        [140, 0, 0, 0, "AMRI", 0, null, null, null, null, "AMRI", "Albany Molecular Research, Inc.", 16.94, 552360000, "1999", "Health Care", "Biotechnology: Commercial Physical & Biological Resarch"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 16, hi: 41 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [141, 0, 0, 0, "ADHD", 0, null, null, null, null, "ADHD", "Alcobra Ltd.", 6.92, 146550000, "2013", "Health Care", "Major Pharmaceuticals"], 
        [142, 0, 0, 0, "ALDR", 0, null, null, null, null, "ALDR", "Alder BioPharmaceuticals, Inc.", 26.06, 982630000, "2014", "Health Care", "Major Pharmaceuticals"], 
        [143, 0, 0, 0, "ALDX", 0, null, null, null, null, "ALDX", "Aldeyra Therapeutics, Inc.", 11.01, 61280000, "2014", "Health Care", "Major Pharmaceuticals"], 
        [144, 0, 0, 0, "ALXN", 0, null, null, null, null, "ALXN", "Alexion Pharmaceuticals, Inc.", 182.29, 36850000000, "1996", "Health Care", "Major Pharmaceuticals"], 
        [145, 0, 0, 0, "ALXA", 0, null, null, null, null, "ALXA", "Alexza Pharmaceuticals, Inc.", 2.07, 40170000, "2006", "Health Care", "Major Pharmaceuticals"], 
        [146, 0, 0, 0, "ALGN", 0, null, null, null, null, "ALGN", "Align Technology, Inc.", 56.9, 4570000000, "2001", "Health Care", "Industrial Specialties"], 
        [147, 0, 0, 0, "ALIM", 0, null, null, null, null, "ALIM", "Alimera Sciences, Inc.", 5.16, 228570000, "2010", "Health Care", "Major Pharmaceuticals"], 
        [148, 0, 0, 0, "ALKS", 0, null, null, null, null, "ALKS", "Alkermes plc", 71.4, 10440000000, "1991", "Health Care", "Major Pharmaceuticals"], 
        [149, 0, 0, 0, "ALGT", 0, null, null, null, null, "ALGT", "Allegiant Travel Company", 178.42, 3120000000, "2006", "Transportation", "Air Freight/Delivery Services"], 
        [150, 0, 0, 0, "AFOP", 0, null, null, null, null, "AFOP", "Alliance Fiber Optic Products, Inc.", 16.51, 307950000, "2000", "Technology", "Semiconductors"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 24, hi: 49 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [151, 0, 0, 0, "AIQ", 0, null, null, null, null, "AIQ", "Alliance HealthCare Services, Inc.", 24.99, 268250000, "2001", "Health Care", "Medical Specialities"], 
        [152, 0, 0, 0, "AHGP", 0, null, null, null, null, "AHGP", "Alliance Holdings GP, L.P.", 53, 3170000000, "2006", "Energy", "Coal Mining"], 
        [153, 0, 0, 0, "ARLP", 0, null, null, null, null, "ARLP", "Alliance Resource Partners, L.P.", 39.29, 2910000000, "1999", "Energy", "Coal Mining"], 
        [154, 0, 0, 0, "AHPI", 0, null, null, null, null, "AHPI", "Allied Healthcare Products, Inc.", 1.56, 12520000, "1992", "Health Care", "Industrial Specialties"], 
        [155, 0, 0, 0, "ALLT", 0, null, null, null, null, "ALLT", "Allot Communications Ltd.", 9.15, 304210000, "2006", "Technology", "Computer Communications Equipment"], 
        [156, 0, 0, 0, "ALNY", 0, null, null, null, null, "ALNY", "Alnylam Pharmaceuticals, Inc.", 95.54, 7830000000, "2004", "Health Care", "Major Pharmaceuticals"], 
        [157, 0, 0, 0, "AOSL", 0, null, null, null, null, "AOSL", "Alpha and Omega Semiconductor Limited", 9.05, 241240000, "2010", "Technology", "Semiconductors"], 
        [158, 0, 0, 0, "ATEC", 0, null, null, null, null, "ATEC", "Alphatec Holdings, Inc.", 1.34, 133460000, "2006", "Health Care", "Medical/Dental Instruments"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 35, hi: 60 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [159, 0, 0, 0, "ALTR", 0, null, null, null, null, "ALTR", "Altera Corporation", 35.66, 10870000000, "1988", "Technology", "Semiconductors"], 
        [160, 0, 0, 0, "AIMC", 0, null, null, null, null, "AIMC", "Altra Industrial Motion Corp.", 27.85, 741790000, "2006", "Capital Goods", "Industrial Machinery/Components"], 
        [161, 0, 0, 0, "AMZN", 0, null, null, null, null, "AMZN", "Amazon.com, Inc.", 381.83, 177320000000, "1997", "Consumer Services", "Catalog/Specialty Distribution"], 
        [162, 0, 0, 0, "AMBA", 0, null, null, null, null, "AMBA", "Ambarella, Inc.", 50.71, 1540000000, "2012", "Technology", "Semiconductors"], 
        [163, 0, 0, 0, "AMDA", 0, null, null, null, null, "AMDA", "Amedica Corporation", 0.65, 8970000, "2014", "Health Care", "Medical/Dental Instruments"], 
        [164, 0, 0, 0, "AGNC", 0, null, null, null, null, "AGNC", "American Capital Agency Corp.", 21.95, 7740000000, "2008", "Consumer Services", "Real Estate Investment Trusts"], 
        [165, 0, 0, 0, "MTGE", 0, null, null, null, null, "MTGE", "American Capital Mortgage Investment Corp.", 18.33, 937430000, "2011", "Consumer Services", "Real Estate Investment Trusts"], 
        [166, 0, 0, 0, "APEI", 0, null, null, null, null, "APEI", "American Public Education, Inc.", 34.36, 593210000, "2007", "Consumer Services", "Other Consumer Services"], 
        [167, 0, 0, 0, "ARII", 0, null, null, null, null, "ARII", "American Railcar Industries, Inc.", 54.26, 1160000000, "2006", "Capital Goods", "Railroads"], 
        [168, 0, 0, 0, "ARCP", 0, null, null, null, null, "ARCP", "American Realty Capital Properties, Inc.", 9.4, 8540000000, "2011", "Consumer Services", "Real Estate Investment Trusts"], 
        [169, 0, 0, 0, "AMSC", 0, null, null, null, null, "AMSC", "American Superconductor Corporation", 0.7999, 76570000, "1991", "Consumer Durables", "Metal Fabrications"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 45, hi: 70 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [170, 0, 0, 0, "AMWD", 0, null, null, null, null, "AMWD", "American Woodmark Corporation", 43.98, 696160000, "1986", "Basic Industries", "Forest Products"], 
        [171, 0, 0, 0, "ABCB", 0, null, null, null, null, "ABCB", "Ameris Bancorp", 25.75, 725140000, "1994", "Finance", "Major Banks"], 
        [172, 0, 0, 0, "AMSF", 0, null, null, null, null, "AMSF", "AMERISAFE, Inc.", 43.7, 822560000, "2005", "Finance", "Property-Casualty Insurers"], 
        [173, 0, 0, 0, "AMGN", 0, null, null, null, null, "AMGN", "Amgen Inc.", 153.48, 116750000000, "1983", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], 
        [174, 0, 0, 0, "FOLD", 0, null, null, null, null, "FOLD", "Amicus Therapeutics, Inc.", 8.36, 796280000, "2007", "Health Care", "Major Pharmaceuticals"], 
        [175, 0, 0, 0, "AMKR", 0, null, null, null, null, "AMKR", "Amkor Technology, Inc.", 8.9, 2110000000, "1998", "Technology", "Semiconductors"], 
        [176, 0, 0, 0, "AMPH", 0, null, null, null, null, "AMPH", "Amphastar Pharmaceuticals, Inc.", 12.76, 569720000, "2014", "Health Care", "Major Pharmaceuticals"], 
        [177, 0, 0, 0, "AMRS", 0, null, null, null, null, "AMRS", "Amyris, Inc.", 2.09, 165270000, "2010", "Basic Industries", "Major Chemicals"], 
        [178, 0, 0, 0, "ANAC", 0, null, null, null, null, "ANAC", "Anacor Pharmaceuticals, Inc.", 40.76, 1750000000, "2010", "Health Care", "Major Pharmaceuticals"], 
        [179, 0, 0, 0, "ANAD", 0, null, null, null, null, "ANAD", "ANADIGICS, Inc.", 1.26, 109090000, "1995", "Technology", "Semiconductors"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 54, hi: 79 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [180, 0, 0, 0, "ALOG", 0, null, null, null, null, "ALOG", "Analogic Corporation", 86.55, 1070000000, "1972", "Capital Goods", "Electrical Products"], 
        [181, 0, 0, 0, "ANCB", 0, null, null, null, null, "ANCB", "Anchor Bancorp", 22.14, 56460000, "2011", "Finance", "Banks"], 
        [182, 0, 0, 0, "ABCW", 0, null, null, null, null, "ABCW", "Anchor BanCorp Wisconsin Inc.", 33.49, 309630000, "2014", "Finance", "Banks"], 
        [183, 0, 0, 0, "AMCF", 0, null, null, null, null, "AMCF", "Andatee China Marine Fuel Services Corporation", 1.44, 14770000, "2010", "Energy", "Oil Refining/Marketing"], 
        [184, 0, 0, 0, "ANGI", 0, null, null, null, null, "ANGI", "Angie&#39;s List, Inc.", 5.02, 293750000, "2011", "Consumer Services", "Advertising"], 
        [185, 0, 0, 0, "ANGO", 0, null, null, null, null, "ANGO", "AngioDynamics, Inc.", 18.78, 672720000, "2004", "Health Care", "Medical/Dental Instruments"], 
        [186, 0, 0, 0, "ANSS", 0, null, null, null, null, "ANSS", "ANSYS, Inc.", 86.26, 7930000000, "1996", "Technology", "Computer Software: Prepackaged Software"], 
        [187, 0, 0, 0, "ANTH", 0, null, null, null, null, "ANTH", "Anthera Pharmaceuticals, Inc.", 3.84, 88090000, "2010", "Health Care", "Major Pharmaceuticals"], 
        [188, 0, 0, 0, "APOL", 0, null, null, null, null, "APOL", "Apollo Education Group, Inc.", 25.97, 2810000000, "1994", "Consumer Services", "Other Consumer Services"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 61, hi: 86 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [189, 0, 0, 0, "AAPL", 0, null, null, null, null, "AAPL", "Apple Inc.", 127.08, 740210000000, "1980", "Technology", "Computer Manufacturing"], 
        [190, 0, 0, 0, "AGTC", 0, null, null, null, null, "AGTC", "Applied Genetic Technologies Corporation", 24.49, 401900000, "2014", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], 
        [191, 0, 0, 0, "AMAT", 0, null, null, null, null, "AMAT", "Applied Materials, Inc.", 24.12, 29460000000, "1972", "Technology", "Semiconductors"], 
        [192, 0, 0, 0, "AMCC", 0, null, null, null, null, "AMCC", "Applied Micro Circuits Corporation", 5.21, 412320000, "1997", "Technology", "Semiconductors"], 
        [193, 0, 0, 0, "AAOI", 0, null, null, null, null, "AAOI", "Applied Optoelectronics, Inc.", 10.15, 150380000, "2013", "Technology", "Semiconductors"], 
        [194, 0, 0, 0, "AREX", 0, null, null, null, null, "AREX", "Approach Resources Inc.", 8.15, 322380000, "2007", "Energy", "Oil & Gas Production"], 
        [195, 0, 0, 0, "AQXP", 0, null, null, null, null, "AQXP", "Aquinox Pharmaceuticals, Inc.", 10.29, 110050000, "2014", "Health Care", "Major Pharmaceuticals"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 75, hi: 100 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [196, 0, 0, 0, "AUMA", 0, null, null, null, null, "AUMA", "AR Capital Acquisition Corp.", 9.75, 292500000, "2014", "Finance", "Business Services"], 
        [197, 0, 0, 0, "ARDM", 0, null, null, null, null, "ARDM", "Aradigm Corporation", 7.66, 112810000, "1996", "Health Care", "Biotechnology: Electromedical & Electrotherapeutic Apparatus"], 
        [198, 0, 0, 0, "PETX", 0, null, null, null, null, "PETX", "Aratana Therapeutics, Inc.", 16.52, 573330000, "2013", "Health Care", "Major Pharmaceuticals"], 
        [199, 0, 0, 0, "ACAT", 0, null, null, null, null, "ACAT", "Arctic Cat Inc.", 39, 504930000, "1990", "Capital Goods", "Industrial Specialties"], 
        [200, 0, 0, 0, "ARDX", 0, null, null, null, null, "ARDX", "Ardelyx, Inc.", 17.14, 317780000, "2014", "Health Care", "Major Pharmaceuticals"], 
        [201, 0, 0, 0, "ARNA", 0, null, null, null, null, "ARNA", "Arena Pharmaceuticals, Inc.", 4.55, 1000000000, "2000", "Health Care", "Major Pharmaceuticals"], 
        [202, 0, 0, 0, "ARGS", 0, null, null, null, null, "ARGS", "Argos Therapeutics, Inc.", 8.35, 164120000, "2014", "Health Care", "Major Pharmaceuticals"], 
        [203, 0, 0, 0, "ARIS", 0, null, null, null, null, "ARIS", "ARI Network Services, Inc.", 3.63, 51660000, "1991", "Technology", "Computer Software: Programming, Data Processing"], 
        [204, 0, 0, 0, "ARIA", 0, null, null, null, null, "ARIA", "ARIAD Pharmaceuticals, Inc.", 7.35, 1380000000, "1994", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], 
        [205, 0, 0, 0, "ARTX", 0, null, null, null, null, "ARTX", "Arotech Corporation", 2.44, 59640000, "1994", "Miscellaneous", "Industrial Machinery/Components"], 
        [206, 0, 0, 0, "ARQL", 0, null, null, null, null, "ARQL", "ArQule, Inc.", 1.35, 84740000, "1996", "Health Care", "Major Pharmaceuticals"], 
        [207, 0, 0, 0, "ARRY", 0, null, null, null, null, "ARRY", "Array BioPharma Inc.", 8.05, 1120000000, "2000", "Health Care", "Major Pharmaceuticals"], 
        [208, 0, 0, 0, "ARUN", 0, null, null, null, null, "ARUN", "Aruba Networks, Inc.", 17.7, 1940000000, "2007", "Technology", "Computer peripheral equipment"], 
        [209, 0, 0, 0, "ASBB", 0, null, null, null, null, "ASBB", "ASB Bancorp, Inc.", 19.9, 87130000, "2011", "Finance", "Savings Institutions"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 81, hi: 106 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [210, 0, 0, 0, "ASML", 0, null, null, null, null, "ASML", "ASML Holding N.V.", 104.48, 45680000000, "1995", "Technology", "Industrial Machinery/Components"], 
        [211, 0, 0, 0, "AZPN", 0, null, null, null, null, "AZPN", "Aspen Technology, Inc.", 38.4, 3390000000, "1994", "Technology", "EDP Services"], 
        [212, 0, 0, 0, "ASFI", 0, null, null, null, null, "ASFI", "Asta Funding, Inc.", 8.46, 109860000, "1995", "Finance", "Finance Companies"], 
        [213, 0, 0, 0, "ATEA", 0, null, null, null, null, "ATEA", "Astea International, Inc.", 1.76, 6310000, "1995", "Technology", "Computer Software: Prepackaged Software"], 
        [214, 0, 0, 0, "ALOT", 0, null, null, null, null, "ALOT", "Astro-Med, Inc.", 14.65, 106060000, "1983", "Technology", "Computer peripheral equipment"], 
        [215, 0, 0, 0, "ATAI", 0, null, null, null, null, "ATAI", "ATA Inc.", 4.15, 95640000, "2008", "Consumer Services", "Other Consumer Services"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 85, hi: 110 } });
    state = GridDataReducer(state, { type: 'range', range: { lo: 88, hi: 113 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [216, 0, 0, 0, "ATRA", 0, null, null, null, null, "ATRA", "Atara Biotherapeutics, Inc.", 18, 363830000, "2014", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], 
        [217, 0, 0, 0, "ATHN", 0, null, null, null, null, "ATHN", "athenahealth, Inc.", 134.605, 5140000000, "2007", "Miscellaneous", "Business Services"], 
        [218, 0, 0, 0, "AFCB", 0, null, null, null, null, "AFCB", "Athens Bancshares Corporation", 24.77, 44630000, "2010", "Finance", "Savings Institutions"], 
        [219, 0, 0, 0, "ATLC", 0, null, null, null, null, "ATLC", "Atlanticus Holdings Corporation", 2.9118, 40500000, "1995", "Finance", "Finance: Consumer Services"], 
        [220, 0, 0, 0, "AFH", 0, null, null, null, null, "AFH", "Atlas Financial Holdings, Inc.", 17.55, 206590000, "2013", "Finance", "Property-Casualty Insurers"], 
        [221, 0, 0, 0, "ATML", 0, null, null, null, null, "ATML", "Atmel Corporation", 8.39, 3500000000, "1991", "Technology", "Semiconductors"], 
        [222, 0, 0, 0, "ATOS", 0, null, null, null, null, "ATOS", "Atossa Genetics Inc.", 1.67, 41020000, "2012", "Health Care", "Medical/Dental Instruments"]
      ]
    });

    // turn around
    state = GridDataReducer(state, { type: 'range', range: { lo: 87, hi: 112 } });
    state = GridDataReducer(state, { type: 'range', range: { lo: 85, hi: 110 } });
    state = GridDataReducer(state, { type: 'range', range: { lo: 70, hi: 95 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [160, 0, 0, 0, "AIMC", 0, null, null, null, null, "AIMC", "Altra Industrial Motion Corp.", 27.85, 741790000, "2006", "Capital Goods", "Industrial Machinery/Components"], 
        [161, 0, 0, 0, "AMZN", 0, null, null, null, null, "AMZN", "Amazon.com, Inc.", 381.83, 177320000000, "1997", "Consumer Services", "Catalog/Specialty Distribution"], 
        [162, 0, 0, 0, "AMBA", 0, null, null, null, null, "AMBA", "Ambarella, Inc.", 50.71, 1540000000, "2012", "Technology", "Semiconductors"], 
        [163, 0, 0, 0, "AMDA", 0, null, null, null, null, "AMDA", "Amedica Corporation", 0.65, 8970000, "2014", "Health Care", "Medical/Dental Instruments"], 
        [164, 0, 0, 0, "AGNC", 0, null, null, null, null, "AGNC", "American Capital Agency Corp.", 21.95, 7740000000, "2008", "Consumer Services", "Real Estate Investment Trusts"], 
        [165, 0, 0, 0, "MTGE", 0, null, null, null, null, "MTGE", "American Capital Mortgage Investment Corp.", 18.33, 937430000, "2011", "Consumer Services", "Real Estate Investment Trusts"], 
        [166, 0, 0, 0, "APEI", 0, null, null, null, null, "APEI", "American Public Education, Inc.", 34.36, 593210000, "2007", "Consumer Services", "Other Consumer Services"], 
        [167, 0, 0, 0, "ARII", 0, null, null, null, null, "ARII", "American Railcar Industries, Inc.", 54.26, 1160000000, "2006", "Capital Goods", "Railroads"], 
        [168, 0, 0, 0, "ARCP", 0, null, null, null, null, "ARCP", "American Realty Capital Properties, Inc.", 9.4, 8540000000, "2011", "Consumer Services", "Real Estate Investment Trusts"], 
        [169, 0, 0, 0, "AMSC", 0, null, null, null, null, "AMSC", "American Superconductor Corporation", 0.7999, 76570000, "1991", "Consumer Durables", "Metal Fabrications"], 
        [170, 0, 0, 0, "AMWD", 0, null, null, null, null, "AMWD", "American Woodmark Corporation", 43.98, 696160000, "1986", "Basic Industries", "Forest Products"], 
        [171, 0, 0, 0, "ABCB", 0, null, null, null, null, "ABCB", "Ameris Bancorp", 25.75, 725140000, "1994", "Finance", "Major Banks"], 
        [172, 0, 0, 0, "AMSF", 0, null, null, null, null, "AMSF", "AMERISAFE, Inc.", 43.7, 822560000, "2005", "Finance", "Property-Casualty Insurers"], 
        [173, 0, 0, 0, "AMGN", 0, null, null, null, null, "AMGN", "Amgen Inc.", 153.48, 116750000000, "1983", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], 
        [174, 0, 0, 0, "FOLD", 0, null, null, null, null, "FOLD", "Amicus Therapeutics, Inc.", 8.36, 796280000, "2007", "Health Care", "Major Pharmaceuticals"], 
        [175, 0, 0, 0, "AMKR", 0, null, null, null, null, "AMKR", "Amkor Technology, Inc.", 8.9, 2110000000, "1998", "Technology", "Semiconductors"], 
        [176, 0, 0, 0, "AMPH", 0, null, null, null, null, "AMPH", "Amphastar Pharmaceuticals, Inc.", 12.76, 569720000, "2014", "Health Care", "Major Pharmaceuticals"], 
        [177, 0, 0, 0, "AMRS", 0, null, null, null, null, "AMRS", "Amyris, Inc.", 2.09, 165270000, "2010", "Basic Industries", "Major Chemicals"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 46, hi: 71 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [136, 0, 0, 0, "AKAM", 0, null, null, null, null, "AKAM", "Akamai Technologies, Inc.", 68.77, 12240000000, "1999", "Miscellaneous", "Business Services"], 
        [137, 0, 0, 0, "AKBA", 0, null, null, null, null, "AKBA", "Akebia Therapeutics, Inc.", 9.32, 189580000, "2014", "Health Care", "Major Pharmaceuticals"], [138, 0, 0, 0, "AKER", 0, null, null, null, null, "AKER", "Akers Biosciences Inc", 3.5, 17340000, "2014", "Health Care", "Biotechnology: In Vitro & In Vivo Diagnostic Substances"], [139, 0, 0, 0, "ALSK", 0, null, null, null, null, "ALSK", "Alaska Communications Systems Group, Inc.", 1.75, 86690000, "1999", "Public Utilities", "Telecommunications Equipment"], [140, 0, 0, 0, "AMRI", 0, null, null, null, null, "AMRI", "Albany Molecular Research, Inc.", 16.94, 552360000, "1999", "Health Care", "Biotechnology: Commercial Physical & Biological Resarch"], [141, 0, 0, 0, "ADHD", 0, null, null, null, null, "ADHD", "Alcobra Ltd.", 6.92, 146550000, "2013", "Health Care", "Major Pharmaceuticals"], [142, 0, 0, 0, "ALDR", 0, null, null, null, null, "ALDR", "Alder BioPharmaceuticals, Inc.", 26.06, 982630000, "2014", "Health Care", "Major Pharmaceuticals"], [143, 0, 0, 0, "ALDX", 0, null, null, null, null, "ALDX", "Aldeyra Therapeutics, Inc.", 11.01, 61280000, "2014", "Health Care", "Major Pharmaceuticals"], [144, 0, 0, 0, "ALXN", 0, null, null, null, null, "ALXN", "Alexion Pharmaceuticals, Inc.", 182.29, 36850000000, "1996", "Health Care", "Major Pharmaceuticals"], [145, 0, 0, 0, "ALXA", 0, null, null, null, null, "ALXA", "Alexza Pharmaceuticals, Inc.", 2.07, 40170000, "2006", "Health Care", "Major Pharmaceuticals"], [146, 0, 0, 0, "ALGN", 0, null, null, null, null, "ALGN", "Align Technology, Inc.", 56.9, 4570000000, "2001", "Health Care", "Industrial Specialties"], [147, 0, 0, 0, "ALIM", 0, null, null, null, null, "ALIM", "Alimera Sciences, Inc.", 5.16, 228570000, "2010", "Health Care", "Major Pharmaceuticals"], [148, 0, 0, 0, "ALKS", 0, null, null, null, null, "ALKS", "Alkermes plc", 71.4, 10440000000, "1991", "Health Care", "Major Pharmaceuticals"], [149, 0, 0, 0, "ALGT", 0, null, null, null, null, "ALGT", "Allegiant Travel Company", 178.42, 3120000000, "2006", "Transportation", "Air Freight/Delivery Services"], [150, 0, 0, 0, "AFOP", 0, null, null, null, null, "AFOP", "Alliance Fiber Optic Products, Inc.", 16.51, 307950000, "2000", "Technology", "Semiconductors"], [151, 0, 0, 0, "AIQ", 0, null, null, null, null, "AIQ", "Alliance HealthCare Services, Inc.", 24.99, 268250000, "2001", "Health Care", "Medical Specialities"], [152, 0, 0, 0, "AHGP", 0, null, null, null, null, "AHGP", "Alliance Holdings GP, L.P.", 53, 3170000000, "2006", "Energy", "Coal Mining"], [153, 0, 0, 0, "ARLP", 0, null, null, null, null, "ARLP", "Alliance Resource Partners, L.P.", 39.29, 2910000000, "1999", "Energy", "Coal Mining"], [154, 0, 0, 0, "AHPI", 0, null, null, null, null, "AHPI", "Allied Healthcare Products, Inc.", 1.56, 12520000, "1992", "Health Care", "Industrial Specialties"], [155, 0, 0, 0, "ALLT", 0, null, null, null, null, "ALLT", "Allot Communications Ltd.", 9.15, 304210000, "2006", "Technology", "Computer Communications Equipment"], [156, 0, 0, 0, "ALNY", 0, null, null, null, null, "ALNY", "Alnylam Pharmaceuticals, Inc.", 95.54, 7830000000, "2004", "Health Care", "Major Pharmaceuticals"], [157, 0, 0, 0, "AOSL", 0, null, null, null, null, "AOSL", "Alpha and Omega Semiconductor Limited", 9.05, 241240000, "2010", "Technology", "Semiconductors"], 
        [158, 0, 0, 0, "ATEC", 0, null, null, null, null, "ATEC", "Alphatec Holdings, Inc.", 1.34, 133460000, "2006", "Health Care", "Medical/Dental Instruments"], 
        [159, 0, 0, 0, "ALTR", 0, null, null, null, null, "ALTR", "Altera Corporation", 35.66, 10870000000, "1988", "Technology", "Semiconductors"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 9, hi: 34 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [100, 0, 0, 0, "TFSC", 0, null, null, null, null, "TFSC", "1347 Capital Corp.", 9.4345671, 56090000, "2014", "Finance", "Business Services"], 
        [101, 0, 0, 0, "PIH", 0, null, null, null, null, "PIH", "1347 Property Insurance Holdings, Inc.", 7.6400987, 48580000, "2014", "Finance", "Property-Casualty Insurers"], 
        [102, 0, 0, 0, "FLWS", 0, null, null, null, null, "FLWS", "1-800 FLOWERS.COM, Inc.", 10.3300001, 668420000, "1999", "Consumer Services", "Other Specialty Stores"], 
        [103, 0, 0, 0, "VNET", 0, null, null, null, null, "VNET", "21Vianet Group, Inc.", 19.05, 1250000000, "2011", "Technology", "Computer Software: Programming, Data Processing"], [104, 0, 0, 0, "TWOU", 0, null, null, null, null, "TWOU", "2U, Inc.", 17.11, 693670000, "2014", "Technology", "Computer Software: Prepackaged Software"], [105, 0, 0, 0, "JOBS", 0, null, null, null, null, "JOBS", "51job, Inc.", 34.86, 2060000000, "2004", "Technology", "Diversified Commercial Services"], [106, 0, 0, 0, "SHLM", 0, null, null, null, null, "SHLM", "A. Schulman, Inc.", 39.83, 1160000000, "1972", "Basic Industries", "Major Chemicals"], [107, 0, 0, 0, "ABAX", 0, null, null, null, null, "ABAX", "ABAXIS, Inc.", 60.93, 1370000000, "1992", "Capital Goods", "Industrial Machinery/Components"], [108, 0, 0, 0, "ABY", 0, null, null, null, null, "ABY", "Abengoa Yield plc", 34.4, 2750000000, "2014", "Public Utilities", "Electric Utilities: Central"], [109, 0, 0, 0, "ABGB", 0, null, null, null, null, "ABGB", "Abengoa, S.A.", 15.52, 2610000000, "2013", "Consumer Services", "Military/Government/Technical"], [110, 0, 0, 0, "ACAD", 0, null, null, null, null, "ACAD", "ACADIA Pharmaceuticals Inc.", 34.21, 3410000000, "1985", "Health Care", "Major Pharmaceuticals"], [111, 0, 0, 0, "XLRN", 0, null, null, null, null, "XLRN", "Acceleron Pharma Inc.", 38.02, 1230000000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [112, 0, 0, 0, "ARAY", 0, null, null, null, null, "ARAY", "Accuray Incorporated", 8, 627920000, "2007", "Health Care", "Medical/Dental Instruments"], [113, 0, 0, 0, "ACRX", 0, null, null, null, null, "ACRX", "AcelRx Pharmaceuticals, Inc.", 7.29, 318630000, "2011", "Health Care", "Major Pharmaceuticals"], [114, 0, 0, 0, "AKAO", 0, null, null, null, null, "AKAO", "Achaogen, Inc.", 11.11, 197290000, "2014", "Health Care", "Major Pharmaceuticals"], [115, 0, 0, 0, "ACHN", 0, null, null, null, null, "ACHN", "Achillion Pharmaceuticals, Inc.", 10.89, 1090000000, "2006", "Health Care", "Major Pharmaceuticals"], 
        [116, 0, 0, 0, "ACOR", 0, null, null, null, null, "ACOR", "Acorda Therapeutics, Inc.", 36.14, 1520000000, "2006", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], 
        [117, 0, 0, 0, "ACTS", 0, null, null, null, null, "ACTS", "Actions Semiconductor Co., Ltd.", 1.54, 132440000, "2005", "Technology", "Semiconductors"], [118, 0, 0, 0, "ACPW", 0, null, null, null, null, "ACPW", "Active Power, Inc.", 1.86, 42950000, "2000", "Public Utilities", "Electric Utilities: Central"], [119, 0, 0, 0, "ADMS", 0, null, null, null, null, "ADMS", "Adamas Pharmaceuticals, Inc.", 16.98, 290800000, "2014", "Health Care", "Major Pharmaceuticals"], [120, 0, 0, 0, "ADUS", 0, null, null, null, null, "ADUS", "Addus HomeCare Corporation", 21.57, 237050000, "2009", "Health Care", "Medical/Nursing Services"], [121, 0, 0, 0, "ADBE", 0, null, null, null, null, "ADBE", "Adobe Systems Incorporated", 76.51, 38130000000, "1986", "Technology", "Computer Software: Prepackaged Software"], [122, 0, 0, 0, "ADTN", 0, null, null, null, null, "ADTN", "ADTRAN, Inc.", 23.11, 1260000000, "1994", "Public Utilities", "Telecommunications Equipment"], [123, 0, 0, 0, "AEIS", 0, null, null, null, null, "AEIS", "Advanced Energy Industries, Inc.", 26.68, 1070000000, "1995", "Capital Goods", "Industrial Machinery/Components"], [124, 0, 0, 0, "ADVS", 0, null, null, null, null, "ADVS", "Advent Software, Inc.", 44.18, 2280000000, "1995", "Technology", "EDP Services"], [125, 0, 0, 0, "AEGR", 0, null, null, null, null, "AEGR", "Aegerion Pharmaceuticals, Inc.", 25.15, 715170000, "2010", "Health Care", "Major Pharmaceuticals"], [126, 0, 0, 0, "AEHR", 0, null, null, null, null, "AEHR", "Aehr Test Systems", 2.47, 31300000, "1997", "Capital Goods", "Electrical Products"], [127, 0, 0, 0, "AEPI", 0, null, null, null, null, "AEPI", "AEP Industries Inc.", 49.71, 252560000, "1986", "Capital Goods", "Specialty Chemicals"], [128, 0, 0, 0, "AERI", 0, null, null, null, null, "AERI", "Aerie Pharmaceuticals, Inc.", 27.91, 669410000, "2013", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], [129, 0, 0, 0, "AVAV", 0, null, null, null, null, "AVAV", "AeroVironment, Inc.", 26.86, 626430000, "2007", "Capital Goods", "Aerospace"], [130, 0, 0, 0, "AFMD", 0, null, null, null, null, "AFMD", "Affimed N.V.", 5.7, 136710000, "2014", "Health Care", "Major Pharmaceuticals"], [131, 0, 0, 0, "AFFX", 0, null, null, null, null, "AFFX", "Affymetrix, Inc.", 11.45, 842530000, "1996", "Capital Goods", "Biotechnology: Laboratory Analytical Instruments"], [132, 0, 0, 0, "AGEN", 0, null, null, null, null, "AGEN", "Agenus Inc.", 5.03, 315300000, "2000", "Health Care", "Biotechnology: Biological Products (No Diagnostic Substances)"], 
        [133, 0, 0, 0, "AGRX", 0, null, null, null, null, "AGRX", "Agile Therapeutics, Inc.", 8.57, 171500000, "2014", "Health Care", "Major Pharmaceuticals"], 
        [134, 0, 0, 0, "AGIO", 0, null, null, null, null, "AGIO", "Agios Pharmaceuticals, Inc.", 118.55, 4380000000, "2013", "Health Care", "Major Pharmaceuticals"], 
        [135, 0, 0, 0, "AMCN", 0, null, null, null, null, "AMCN", "AirMedia Group Inc", 2.28, 135810000, "2007", "Technology", "Advertising"]
      ]
    });
    expect(uniqueKeys(state.rows)).toEqual(true);

    state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 25 } });
    state = GridDataReducer(state, { type: 'range', range: { lo: 3, hi: 28 } });
    state = GridDataReducer(state, { type: 'range', range: { lo: 6, hi: 31 } });
    state = GridDataReducer(state, { type: 'range', range: { lo: 8, hi: 33 } });
    state = GridDataReducer(state, { type: 'range', range: { lo: 12, hi: 37 } });
    state = GridDataReducer(state, { type: 'range', range: { lo: 16, hi: 41 } });
    state = GridDataReducer(state, {
      type: 'data', offset: 100, rowCount: 1247, rows: [
        [144, 0, 0, 0, "ALXN", 0, null, null, null, null, "ALXN", "Alexion Pharmaceuticals, Inc.", 182.29, 36850000000, "1996", "Health Care", "Major Pharmaceuticals"], 
        [145, 0, 0, 0, "ALXA", 0, null, null, null, null, "ALXA", "Alexza Pharmaceuticals, Inc.", 2.07, 40170000, "2006", "Health Care", "Major Pharmaceuticals"], 
        [146, 0, 0, 0, "ALGN", 0, null, null, null, null, "ALGN", "Align Technology, Inc.", 56.9, 4570000000, "2001", "Health Care", "Industrial Specialties"], 
        [147, 0, 0, 0, "ALIM", 0, null, null, null, null, "ALIM", "Alimera Sciences, Inc.", 5.16, 228570000, "2010", "Health Care", "Major Pharmaceuticals"], 
        [148, 0, 0, 0, "ALKS", 0, null, null, null, null, "ALKS", "Alkermes plc", 71.4, 10440000000, "1991", "Health Care", "Major Pharmaceuticals"], 
        [149, 0, 0, 0, "ALGT", 0, null, null, null, null, "ALGT", "Allegiant Travel Company", 178.42, 3120000000, "2006", "Transportation", "Air Freight/Delivery Services"], 
        [150, 0, 0, 0, "AFOP", 0, null, null, null, null, "AFOP", "Alliance Fiber Optic Products, Inc.", 16.51, 307950000, "2000", "Technology", "Semiconductors"]
      ]
    });

    state = GridDataReducer(state, { type: 'range', range: { lo: 20, hi: 45 } });

    expect(uniqueKeys(state.rows)).toEqual(true);




  });

});