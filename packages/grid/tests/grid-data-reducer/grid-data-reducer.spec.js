const { GridDataReducer } = require('../dist/index.js');
const { rows, getRows } = require('./test-data.js');

describe('grid-data-reducer', () => {

  describe('initialisation', () => {
    test('init, default bufferSize', () => {
      const initialState = GridDataReducer(undefined, { type: 'clear', range: { lo: 0, hi: 20 } });
      expect(initialState).toEqual({
        bufferIdx: { lo: 0, hi: 0 },
        buffer: [],
        bufferSize: 100,
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

      expect(state.bufferIdx).toEqual({ lo: 1, hi: 11 });
      expect(state.rows).toEqual(rowsOut);
      const rows1 = state.rows;

      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [130, 0, 0, 0, 0, 'key-30'],
        ]
      });

      expect(state.rows === rows1).toBe(true);

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

      expect(state.rows === rows1).toBe(true);

    });

    test('scroll beyond current viewport', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows });

      const rowsOut = [
        [120, 0, 0, 0, 0, 'key-20'],
        [121, 1, 0, 0, 0, 'key-21'],
        [122, 2, 0, 0, 0, 'key-22'],
        [123, 3, 0, 0, 0, 'key-23'],
        [124, 4, 0, 0, 0, 'key-24'],
        [125, 5, 0, 0, 0, 'key-25'],
        [126, 6, 0, 0, 0, 'key-26'],
        [127, 7, 0, 0, 0, 'key-27'],
        [128, 8, 0, 0, 0, 'key-28'],
        [129, 9, 0, 0, 0, 'key-29']
      ];

      state = GridDataReducer(state, { type: 'range', range: { lo: 20, hi: 30 } });
      expect(state.rows).toEqual(rowsOut);

      const rowsOut2 = state.rows;
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [130, 0, 0, 0, 0, 'key-30'],
          [131, 0, 0, 0, 0, 'key-31'],
          [132, 0, 0, 0, 0, 'key-32'],
          [133, 0, 0, 0, 0, 'key-33'],
          [134, 0, 0, 0, 0, 'key-34'],
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
          [145, 0, 0, 0, 0, 'key-45'],
          [146, 0, 0, 0, 0, 'key-46'],
          [147, 0, 0, 0, 0, 'key-47'],
          [148, 0, 0, 0, 0, 'key-48'],
          [149, 0, 0, 0, 0, 'key-49'],
        ]
      });
      expect(state.rows === rowsOut2).toBe(true);
    })

    test('scroll beyond current viewport and partially out of buffer', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows });

      const rowsOut1 = state.rows;

      state = GridDataReducer(state, { type: 'range', range: { lo: 25, hi: 35 } });

      // if we can't fill the full request from buffer we return existing rows, so will not render
      expect(state.rows === rowsOut1).toBe(true);

      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: [
          [130, 0, 0, 0, 0, 'key-30'],
          [131, 0, 0, 0, 0, 'key-31'],
          [132, 0, 0, 0, 0, 'key-32'],
          [133, 0, 0, 0, 0, 'key-33'],
          [134, 0, 0, 0, 0, 'key-34'],
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
          [145, 0, 0, 0, 0, 'key-45'],
          [146, 0, 0, 0, 0, 'key-46'],
          [147, 0, 0, 0, 0, 'key-47'],
          [148, 0, 0, 0, 0, 'key-48'],
          [149, 0, 0, 0, 0, 'key-49'],
          [150, 0, 0, 0, 0, 'key-50'],
          [151, 0, 0, 0, 0, 'key-51'],
          [152, 0, 0, 0, 0, 'key-52'],
          [153, 0, 0, 0, 0, 'key-53'],
          [154, 0, 0, 0, 0, 'key-54'],
        ]
      });

      expect(state.buffer.length).toBe(50);
      expect(state.rows).toEqual([
        [125, 0, 0, 0, 0, 'key-25'],
        [126, 1, 0, 0, 0, 'key-26'],
        [127, 2, 0, 0, 0, 'key-27'],
        [128, 3, 0, 0, 0, 'key-28'],
        [129, 4, 0, 0, 0, 'key-29'],
        [130, 5, 0, 0, 0, 'key-30'],
        [131, 6, 0, 0, 0, 'key-31'],
        [132, 7, 0, 0, 0, 'key-32'],
        [133, 8, 0, 0, 0, 'key-33'],
        [134, 9, 0, 0, 0, 'key-34']
      ]);

    });

    test('jump to end', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0,30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70,100) });

      expect(state.buffer.length).toBe(30);
      expect(state.rows).toEqual([
        [ 190, 0, 0, 0, 'key-090' ],
        [ 191, 1, 0, 0, 'key-091' ],
        [ 192, 2, 0, 0, 'key-092' ],
        [ 193, 3, 0, 0, 'key-093' ],
        [ 194, 4, 0, 0, 'key-094' ],
        [ 195, 5, 0, 0, 'key-095' ],
        [ 196, 6, 0, 0, 'key-096' ],
        [ 197, 7, 0, 0, 'key-097' ],
        [ 198, 8, 0, 0, 'key-098' ],
        [ 199, 9, 0, 0, 'key-099' ]
       ]);
    });
  });

  describe('BWD scrolling', () => {

    test(`scroll back 1 row`, () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0,30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70,100) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 89, hi: 99 } });
      expect(state.rows).toEqual([
        [ 189, 9, 0, 0, 'key-089' ],
        [ 190, 0, 0, 0, 'key-090' ],
        [ 191, 1, 0, 0, 'key-091' ],
        [ 192, 2, 0, 0, 'key-092' ],
        [ 193, 3, 0, 0, 'key-093' ],
        [ 194, 4, 0, 0, 'key-094' ],
        [ 195, 5, 0, 0, 'key-095' ],
        [ 196, 6, 0, 0, 'key-096' ],
        [ 197, 7, 0, 0, 'key-097' ],
        [ 198, 8, 0, 0, 'key-098' ]       ]);

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

      // we\re gaining 150 rows here and losing 50, we end up with 320 - is this right ?
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(257, 407) });
      expect(state.buffer.length).toBe(320);


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
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(407, 457) });
      expect(state.buffer.length).toBe(320);

      state = GridDataReducer(state, { type: 'range', range: { lo: 269, hi: 289 } });
      state = GridDataReducer(state, { type: 'range', range: { lo: 290, hi: 310 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(457, 510) });

      expect(state.buffer.length).toBe(320);


    })
  });


});