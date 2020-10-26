const { GridDataReducer } = require('../dist/index.js');
const { rows } = require('./test-data.js');

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

  });

  describe('data', () => {

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

    })
  })

  describe('dataRequired', () => {

    test('no data required on snall scrolls', () => {

    })
  })


});