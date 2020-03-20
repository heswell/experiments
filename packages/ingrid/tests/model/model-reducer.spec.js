const {
  Action,
  DEFAULT_MODEL_STATE,
  ModelReducer
} = require('../dist/index.js')

const INSTRUMENTS_CONFIG = {
  columns: [
    {name: "Symbol", width: 120 },
    {name: "Name", width: 200 },
    {
      name: "Price", 
      type: {
        name: "number",
        renderer: {name: "background",flashStyle: "arrow-bg" },
        formatting: { decimals: 2, zeroPad: true }
      },
      aggregate: "avg"
    },
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

        _columns: [],
        _groups: [],
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

      expect(state).toEqual({
        ...DEFAULT_MODEL_STATE,

        width: 1100,
        totalColumnWidth: 1100,

        _columns: [],
        _groups: [],
        _headingDepth: 1,

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

  });


})