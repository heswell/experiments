const {
  Action,
  DEFAULT_MODEL_STATE,
  ModelReducer
} = require('../dist/index.js')

const INSTRUMENTS_CONFIG = {
  columns: [
    {name: "Symbol", width: 120 },
    {name: "Name", width: 200 },
    {name: "Price", type: "number", aggregate: "avg"},
    {name: "MarketCap", type: "number", aggregate: "sum"},
    {name: "IPO" },
    {name: "Sector"},
    {name: "Industry"}
  ],
  scrollbarSize: 15,
  width: 1100,
  height: 600,
  headerHeight: 24,
  rowStripes: false
}

describe('model-reducer', () => {

  describe('initialize', () => {

    test('initial state, no supplied config', () => {
      const state = ModelReducer(DEFAULT_MODEL_STATE, {
        type: Action.INITIALIZE,
        gridState: {}
      });

      expect(state).toEqual({
        ...DEFAULT_MODEL_STATE,

        columnGroups: [],
        dimensions: {
          ...DEFAULT_MODEL_STATE.dimensions,
          contentHeight: 275
        },
        _headingDepth: 0,

        columnMap: {},

        meta: {
          IDX: 0,
          RENDER_IDX: 1,
          DEPTH: 2,
          COUNT: 3,
          KEY: 4,
          SELECTED: 5,
          PARENT_IDX: 6,
          IDX_POINTER: 7,
          FILTER_COUNT: 8,
          NEXT_FILTER_IDX: 9,
          count: 10
        }
      });
    });

    test('initial state, Instrument config', () => {
      const state = ModelReducer(DEFAULT_MODEL_STATE, {
        type: Action.INITIALIZE,
        gridState: INSTRUMENTS_CONFIG
      });

      const hidden = undefined;
      const sorted = undefined;

      expect(state).toEqual({
        ...DEFAULT_MODEL_STATE,
        dimensions: {
            contentHeight: 576,
            height: 600,
            width: 1100
        },
        displayWidth: 1100,
        headerHeight: 24,
        totalColumnWidth: 1100,

        columns: [
          {name: "Symbol", width: 120, key: 0 },
          {name: "Name", width: 200, key: 1 },
          {name: "Price",type: "number", aggregate: "avg", key: 2},
          {name: "MarketCap", type: "number", aggregate: "sum", key: 3},
          {name: "IPO", key: 4 },
          {name: "Sector", key: 5 },
          {name: "Industry", key: 6 }
        ],

        columnGroups: [{
          columns: [
            {name: "Symbol", key: 0, label: "Symbol", width: 120, hidden, sorted},
            {name: "Name", key: 1, label: "Name", width: 200, hidden, sorted},
            {name: "Price", key: 2, label: "Price", type: "number", aggregate: "avg", hidden, sorted, width: 156},
            {name: "MarketCap", key: 3, label: "MarketCap", type: "number", aggregate: "sum", hidden, sorted, width: 156},
            {name: "IPO", key: 4, label: "IPO" , hidden, sorted, width: 156},
            {name: "Sector", key: 5, label: "Sector", hidden, sorted, width: 156},
            {name: "Industry", key: 6, label: "Industry", hidden, sorted, width: 156}
          ],
          headings: undefined,
          locked: false,
          renderWidth: 1100,
          width: 1100
        }],
        _headingDepth: 1,

        columnMap: {
          Symbol: 0,          
          Name: 1,
          Price: 2,
          MarketCap: 3,
          IPO: 4,
          Sector: 5,
          Industry: 6,
        },

        meta: {
          IDX: 7,
          RENDER_IDX: 8,
          DEPTH: 9,
          COUNT: 10,
          KEY: 11,
          SELECTED: 12,
          PARENT_IDX: 13,
          IDX_POINTER: 14,
          FILTER_COUNT: 15,
          NEXT_FILTER_IDX: 16,
          count: 17
        }
      });
    });

  });

  describe('column resize', () => {

    test('resize Instruments column', () => {
      let state = ModelReducer(DEFAULT_MODEL_STATE, {
        type: Action.INITIALIZE,
        gridState: INSTRUMENTS_CONFIG
      });

      expect(state.totalColumnWidth).toEqual(1100);

      let [, column] = state.columnGroups[0].columns;

      state = ModelReducer(state, {type: Action.COLUMN_RESIZE_BEGIN, column});
      ([, column] = state.columnGroups[0].columns);

      expect(column.resizing).toBe(true);

      state = ModelReducer(state, {type: Action.COLUMN_RESIZE, column, width: 201});
      ([, column] = state.columnGroups[0].columns);

      expect(state.totalColumnWidth).toEqual(1101);
      expect(column.width).toEqual(201);

      state = ModelReducer(state, {type: Action.COLUMN_RESIZE, column, width: 205});
      ([, column] = state.columnGroups[0].columns);

      expect(state.totalColumnWidth).toEqual(1105);
      expect(column.width).toEqual(205);

    })


  })




})