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
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(0,30) });

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
      expect(state.rows).toEqual(rowsOut);

      const rowsOut2 = state.rows;
      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: getRows(30, 50)});
      expect(state.rows === rowsOut2).toBe(true);
    })

    test('scroll beyond current viewport and partially out of buffer', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows: getRows(0,30) });

      const rowsOut1 = state.rows;

      state = GridDataReducer(state, { type: 'range', range: { lo: 25, hi: 35 } });

      // if we can't fill the full request from buffer we return existing rows, so will not render
      expect(state.rows === rowsOut1).toBe(true);

      state = GridDataReducer(state, {
        type: 'data', offset: 100, rowCount: 1000, rows: getRows(30,55)});

      expect(state.buffer.length).toBe(50);
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
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0,110) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 243, hi: 263 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(143,363) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 637, hi: 657 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(537,757) });

      expect(state.buffer.length).toEqual(220);

      expect(state.rows).toEqual([
        [ 737, 0, 0, 0, 'key-637' ],
        [ 738, 1, 0, 0, 'key-638' ],
        [ 739, 2, 0, 0, 'key-639' ],
        [ 740, 3, 0, 0, 'key-640' ],
        [ 741, 4, 0, 0, 'key-641' ],
        [ 742, 5, 0, 0, 'key-642' ],
        [ 743, 6, 0, 0, 'key-643' ],
        [ 744, 7, 0, 0, 'key-644' ],
        [ 745, 8, 0, 0, 'key-645' ],
        [ 746, 9, 0, 0, 'key-646' ],
        [ 747, 10, 0, 0, 'key-647' ],
        [ 748, 11, 0, 0, 'key-648' ],
        [ 749, 12, 0, 0, 'key-649' ],
        [ 750, 13, 0, 0, 'key-650' ],
        [ 751, 14, 0, 0, 'key-651' ],
        [ 752, 15, 0, 0, 'key-652' ],
        [ 753, 16, 0, 0, 'key-653' ],
        [ 754, 17, 0, 0, 'key-654' ],
        [ 755, 18, 0, 0, 'key-655' ],
        [ 756, 19, 0, 0, 'key-656' ]       
      ]);
    });

    test('jump ahead, then back', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 100, range: { lo: 0, hi: 20 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0,110) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 978, hi: 998 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(878,1098) });

      state = GridDataReducer(state, { type: 'range', range: { lo: 28, hi: 48 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0,148) });

      expect(state.buffer.length).toBe(148);
      expect(state.rows).toEqual([
        [ 128, 0, 0, 0, 'key-028' ],
        [ 129, 1, 0, 0, 'key-029' ],
        [ 130, 2, 0, 0, 'key-030' ],
        [ 131, 3, 0, 0, 'key-031' ],
        [ 132, 4, 0, 0, 'key-032' ],
        [ 133, 5, 0, 0, 'key-033' ],
        [ 134, 6, 0, 0, 'key-034' ],
        [ 135, 7, 0, 0, 'key-035' ],
        [ 136, 8, 0, 0, 'key-036' ],
        [ 137, 9, 0, 0, 'key-037' ],
        [ 138, 10, 0, 0, 'key-038' ],
        [ 139, 11, 0, 0, 'key-039' ],
        [ 140, 12, 0, 0, 'key-040' ],
        [ 141, 13, 0, 0, 'key-041' ],
        [ 142, 14, 0, 0, 'key-042' ],
        [ 143, 15, 0, 0, 'key-043' ],
        [ 144, 16, 0, 0, 'key-044' ],
        [ 145, 17, 0, 0, 'key-045' ],
        [ 146, 18, 0, 0, 'key-046' ],
        [ 147, 19, 0, 0, 'key-047' ]
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

    });

    test(`scroll back 5 row`, () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0,30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70,100) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 85, hi: 95 } });
      expect(state.dataRequired).toBe(false);
      expect(state.buffer.length).toBe(30);
      expect(state.rows).toEqual([
        [ 185, 5, 0, 0, 'key-085' ],
        [ 186, 6, 0, 0, 'key-086' ],
        [ 187, 7, 0, 0, 'key-087' ],
        [ 188, 8, 0, 0, 'key-088' ],
        [ 189, 9, 0, 0, 'key-089' ],
        [ 190, 0, 0, 0, 'key-090' ],
        [ 191, 1, 0, 0, 'key-091' ],
        [ 192, 2, 0, 0, 'key-092' ],
        [ 193, 3, 0, 0, 'key-093' ],
        [ 194, 4, 0, 0, 'key-094' ]
      ]);
    });

    test(`scroll beyond buffer threshold`, () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0,30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70,100) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 83, hi: 93 } });
      expect(state.dataRequired).toBe(false);
      expect(state.buffer.length).toBe(30);
      state = GridDataReducer(state, { type: 'range', range: { lo: 78, hi: 88 } });
      expect(state.dataRequired).toBe(true);
      expect(state.buffer.length).toBe(30);
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(58,70) });
      expect(state.dataRequired).toBe(false);
      expect(state.buffer.length).toBe(42);

    })

    test(`scroll beyond viewport`, () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(0,30) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 90, hi: 100 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 100, rows: getRows(70,100) });
      state = GridDataReducer(state, { type: 'range', range: { lo: 79, hi: 89 } });

      expect(state.rows).toEqual([
        [ 179, 0, 0, 0, 'key-079' ],
        [ 180, 1, 0, 0, 'key-080' ],
        [ 181, 2, 0, 0, 'key-081' ],
        [ 182, 3, 0, 0, 'key-082' ],
        [ 183, 4, 0, 0, 'key-083' ],
        [ 184, 5, 0, 0, 'key-084' ],
        [ 185, 6, 0, 0, 'key-085' ],
        [ 186, 7, 0, 0, 'key-086' ],
        [ 187, 8, 0, 0, 'key-087' ],
        [ 188, 9, 0, 0, 'key-088' ]
      ]);
    })


  })


  describe('growing the range', () => {

    test('first few rows', () => {
      let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 20, range: { lo: 0, hi: 10 } });
      state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1000, rows });
      state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 11 } });

      expect(state.rows).toEqual([
        [ 100, 0, 0, 0, 0, 'key-00' ],
        [ 101, 1, 0, 0, 0, 'key-01' ],
        [ 102, 2, 0, 0, 0, 'key-02' ],
        [ 103, 3, 0, 0, 0, 'key-03' ],
        [ 104, 4, 0, 0, 0, 'key-04' ],
        [ 105, 5, 0, 0, 0, 'key-05' ],
        [ 106, 6, 0, 0, 0, 'key-06' ],
        [ 107, 7, 0, 0, 0, 'key-07' ],
        [ 108, 8, 0, 0, 0, 'key-08' ],
        [ 109, 9, 0, 0, 0, 'key-09' ],
        [ 110, 10, 0, 0, 0, 'key-10' ]
      ]);

      state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 13 } });

      expect(state.rows).toEqual([
        [ 100, 0, 0, 0, 0, 'key-00' ],
        [ 101, 1, 0, 0, 0, 'key-01' ],
        [ 102, 2, 0, 0, 0, 'key-02' ],
        [ 103, 3, 0, 0, 0, 'key-03' ],
        [ 104, 4, 0, 0, 0, 'key-04' ],
        [ 105, 5, 0, 0, 0, 'key-05' ],
        [ 106, 6, 0, 0, 0, 'key-06' ],
        [ 107, 7, 0, 0, 0, 'key-07' ],
        [ 108, 8, 0, 0, 0, 'key-08' ],
        [ 109, 9, 0, 0, 0, 'key-09' ],
        [ 110, 10, 0, 0, 0, 'key-10' ],
        [ 111, 11, 0, 0, 0, 'key-11' ],
        [ 112, 12, 0, 0, 0, 'key-12' ]
      ]);

      state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 16 } });
      expect(state.dataRequired).toEqual(false);

      expect(state.rows).toEqual([
        [ 100, 0, 0, 0, 0, 'key-00' ],
        [ 101, 1, 0, 0, 0, 'key-01' ],
        [ 102, 2, 0, 0, 0, 'key-02' ],
        [ 103, 3, 0, 0, 0, 'key-03' ],
        [ 104, 4, 0, 0, 0, 'key-04' ],
        [ 105, 5, 0, 0, 0, 'key-05' ],
        [ 106, 6, 0, 0, 0, 'key-06' ],
        [ 107, 7, 0, 0, 0, 'key-07' ],
        [ 108, 8, 0, 0, 0, 'key-08' ],
        [ 109, 9, 0, 0, 0, 'key-09' ],
        [ 110, 10, 0, 0, 0, 'key-10' ],
        [ 111, 11, 0, 0, 0, 'key-11' ],
        [ 112, 12, 0, 0, 0, 'key-12' ],
        [ 113, 13, 0, 0, 0, 'key-13' ],
        [ 114, 14, 0, 0, 0, 'key-14' ],
        [ 115, 15, 0, 0, 0, 'key-15' ]
      ]);

      state = GridDataReducer(state, { type: 'range', range: { lo: 0, hi: 21} });
      expect(state.dataRequired).toEqual(true);

      
      console.log(state)

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
        [ 1149, 25, 0, 0, 'key-049' ],
        [ 1150, 26, 0, 0, 'key-050' ],
        [ 1151, 27, 0, 0, 'key-051' ],
        [ 1152, 28, 0, 0, 'key-052' ],
        [ 1153, 29, 0, 0, 'key-053' ],
        [ 1154, 30, 0, 0, 'key-054' ],
        [ 1155, 31, 0, 0, 'key-055' ],
        [ 1156, 32, 0, 0, 'key-056' ],
        [ 1157, 33, 0, 0, 'key-057' ],
        [ 1158, 34, 0, 0, 'key-058' ],
        [ 1159, 35, 0, 0, 'key-059' ],
        [ 1160, 36, 0, 0, 'key-060' ],
        [ 1161, 37, 0, 0, 'key-061' ],
        [ 1162, 38, 0, 0, 'key-062' ],
        [ 1163, 39, 0, 0, 'key-063' ],
        [ 1164, 0, 0, 0, 'key-064' ],
        [ 1165, 1, 0, 0, 'key-065' ],
        [ 1166, 2, 0, 0, 'key-066' ],
        [ 1167, 3, 0, 0, 'key-067' ],
        [ 1168, 4, 0, 0, 'key-068' ],
        [ 1169, 5, 0, 0, 'key-069' ],
        [ 1170, 6, 0, 0, 'key-070' ],
        [ 1171, 7, 0, 0, 'key-071' ],
        [ 1172, 8, 0, 0, 'key-072' ],
        [ 1173, 9, 0, 0, 'key-073' ],
        [ 1174, 10, 0, 0, 'key-074' ],
        [ 1175, 11, 0, 0, 'key-075' ],
        [ 1176, 12, 0, 0, 'key-076' ],
        [ 1177, 13, 0, 0, 'key-077' ],
        [ 1178, 14, 0, 0, 'key-078' ],
        [ 1179, 15, 0, 0, 'key-079' ],
        [ 1180, 16, 0, 0, 'key-080' ],
        [ 1181, 17, 0, 0, 'key-081' ],
        [ 1182, 18, 0, 0, 'key-082' ],
        [ 1183, 19, 0, 0, 'key-083' ],
        [ 1184, 20, 0, 0, 'key-084' ],
        [ 1185, 21, 0, 0, 'key-085' ],
        [ 1186, 22, 0, 0, 'key-086' ],
        [ 1187, 23, 0, 0, 'key-087' ],
        [ 1188, 24, 0, 0, 'key-088' ]
      ]);

    });

    test.only('jump to near end, scroll backwards, using renderBuffer', () => {
        let state = GridDataReducer(undefined, { type: 'clear', bufferSize: 100, range: { lo: 0, hi: 63 } });
        state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(0, 163) });
        state = GridDataReducer(state, { type: 'range', range: { lo: 1186, hi: 1269 } });
debugger;
        state = GridDataReducer(state, { type: 'data', offset: 100, rowCount: 1247, rows: getRows(1086, 1247) });
        console.log(state)
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


  });


});