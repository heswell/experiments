
import { metadataKeys, update as updateRows } from "@heswell/utils";
import { bufferMinMax, firstAndLastIdx, range as $range, rangeLowHigh, reassignKeys } from './grid-data-helpers';
import * as Action from "./grid-data-actions";

const { IDX, RENDER_IDX } = metadataKeys;

const dupeCheck = rows => {
  const map = {}
  for (let i=0;i<rows.length;i++){
    if (map[rows[i][RENDER_IDX]] !== undefined) {
      debugger;
    }
    map[rows[i][RENDER_IDX]] = true;
  }
}

/** @type {(any) =>  GridData} */
export const initData = ({ range, bufferSize = 100 }) => ({
  //TODO RingBuffer ?
  bufferIdx: { lo: 0, hi: 0 },
  buffer: [],
  bufferSize,
  rows: [],
  rowCount: 0,
  range,
  offset: 0,
  keys: {
    free: [],
    used: {}
  },
  dataRequired: true
});

// This assumes model.meta never changes. If it does (columns etc)
// we will need additional action types to update
/** @type {DataReducer} */
export default (state = initData({}), action) => {
  if (action.type === "range") {
    return setRange(state, action);
  } else if (action.type === "data") {
    return setData(state, action);
  } else if (action.type === "update") {
    return applyUpdates(state, action);
  } else if (action.type === Action.ROWCOUNT) {
    return setSize(state, action);
  } else if (action.type === 'clear') {
    return initData({ range: action.range, bufferSize: action.bufferSize });
  } else {
    throw Error(`GridDataReducer unknown action type ${action.type}`);
  }
}

function setSize(state, { rowCount }) {
  return { ...state, rowCount };
}
//TODO we HAVE to remove out=of-range rows and add empty placeholders
/** @type {DataReducer} */
function setRange(state, { range }) {

  if (state.range === undefined || range.lo !== state.range.lo || range.hi !== state.range.hi) {

    const [low, high] = rangeLowHigh(range, state.offset, state.rowCount);
    let [firstBufIdx, lastBufIdx] = firstAndLastIdx(state.buffer);

    if (low >= firstBufIdx && high <= lastBufIdx + 1) {
      // we have all required data in buffer already
      const bufferIdx = {
        lo: low - firstBufIdx,
        hi: high - firstBufIdx
      };

      reassignKeys(state, bufferIdx);
      const direction = scrollDirection(state.range, range);

      const rows = state.buffer.slice(bufferIdx.lo, bufferIdx.hi);

      dupeCheck(rows);

      if (state.keys.free.length > 0){
        debugger;
      }
  
      return {
        ...state,
        bufferIdx,
        rows,
        range,
        dataRequired: (
          (direction === 'FWD' && lastBufIdx - high < state.bufferSize / 2) ||
          (direction === 'BWD' && low < state.bufferSize / 2)) ? true : false
      }

    } else {
      return {
        ...state,
        range,
        dataRequired: true
      }
    }

  } else {
    return state;
  }

}


function applyUpdates(state, action) {
  const rows = updateRows(state.rows, action.updates, metadataKeys);
  return {
    ...state,
    rows
  };
}

/** @type {DataReducer} */
function setData(state, action) {
  const { offset, rowCount } = action;
  const [buffer, bufferIdx, keys, rowsChanged] = addToBuffer(
    state,
    action.rows,
    rowCount,
    offset,
  );

    if (keys.free.length > 0){
      debugger;
    }

  return {
    bufferIdx,
    buffer,
    bufferSize: state.bufferSize,
    rows: rowsChanged ? buffer.slice(bufferIdx.lo, bufferIdx.hi) : state.rows,
    rowCount,
    offset,
    range: state.range,
    keys,
    dataRequired: false
  };
}

// TODO create a pool of these and reuse them
function emptyRow(idx,) {
  const { IDX, count } = metadataKeys;
  const row = Array(count);
  row[IDX] = idx;
  return row;
}

/** @type {(...args: any[]) => [any[], {lo:number, hi:number}, RowKeys, boolean]} */
function addToBuffer(
  state,
  incomingRows,
  size,
  offset = 0,
) {

  const { buffer, bufferSize, range, rows, keys } = state;
  const [firstRowIdx, lastRowIdx] = firstAndLastIdx(incomingRows);
  let [firstBufIdx, lastBufIdx] = firstAndLastIdx(buffer);
  const [bufferMin, bufferMax] = bufferMinMax(range, size, bufferSize, offset);
  const { free: freeKeys, used: usedKeys } = keys;
  const [low, high] = rangeLowHigh(range, offset, size);

  let maxKey = rows.length;
  let row, rowIdx, rowKey;
  let rowsChanged = true;

  if (firstBufIdx !== -1 && firstBufIdx < bufferMin) {
    const doomedCount = bufferMin - firstBufIdx;
    // before we remove, do we need to reclaim keys ?
    for (let index=0,i=firstBufIdx;i<bufferMin; i++, index++){
      // apply the doomedCount to offset as the index will be adjusted once we remove the rows
      if (index >= state.bufferIdx.lo && index < state.bufferIdx.hi){
        const rowKey = buffer[i-offset][RENDER_IDX];
        freeKeys.push(rowKey);
        usedKeys[rowKey] = undefined;
      }
    }
    buffer.splice(0, doomedCount);
    firstBufIdx = bufferMin;

  } else if (lastBufIdx !== -1 && lastBufIdx > bufferMax) {
    const doomedCount = lastBufIdx - bufferMax + 1;
    buffer.splice(-doomedCount, doomedCount);
    lastBufIdx = bufferMax;
  }

  if (firstBufIdx === -1) {
    firstBufIdx = firstRowIdx;
  }
  if (lastBufIdx === -1) {
    lastBufIdx = lastRowIdx;
  }


  const writePosition = firstRowIdx - firstBufIdx;
  if (writePosition < 0){
    firstBufIdx += writePosition;
  }

  const lo = low - firstBufIdx;
  const hi = high - firstBufIdx;

  if (firstRowIdx >= high || lastRowIdx < low) {
    rowsChanged = false;
  } else {
    reassignKeys(state, { lo, hi });
  }

  const count = incomingRows.length
  for (let i = 0, idx = writePosition; i < count; i++, idx++) {
    row = incomingRows[i];
    rowIdx = row[IDX];

    if (rowIdx >= low && rowIdx < high) {
      if (buffer[idx]) {
        // is this right - it is if we're replacing the same row
        rowKey = buffer[idx][RENDER_IDX];
      } else {
        rowKey = freeKeys.shift();
      }
      if (rowKey === undefined) {
        rowKey = maxKey++;
        usedKeys[rowKey] = 1;
      }
      row[RENDER_IDX] = rowKey;
    }
    if (idx < 0) {
      // not efficient, to be addressed
      buffer.splice(-writePosition - -idx, 0, row);
    } else {
      buffer[idx] = row;
    }
  }

  if (keys.free.length > 0){
    debugger;
  }

  return [
    buffer,
    { lo, hi },
    {
      free: freeKeys,
      used: usedKeys
    },
    rowsChanged
  ];
}


function scrollDirection(range1, range2) {
  if (range1 === null) {
    return 'INIT';
  } else if (range2.lo > range1.lo) {
    return 'FWD';
  } else if (range2.lo < range1.lo) {
    return 'BWD';
  } else {
    return 'UNKNOWN'
  }
}