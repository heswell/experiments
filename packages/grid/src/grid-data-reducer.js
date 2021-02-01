
import { metadataKeys, update as updateRows } from "@heswell/utils";
import {
  anyRowsInRange,
  bufferMinMax,
  firstAndLastIdx,
  getFullBufferSize,
  initKeys,
  isDataOutOfRange,
  rangeLowHigh,
  reassignKeys,
  scrollDirection
} from './grid-data-helpers';
import * as Action from "./grid-data-actions";

const { IDX, RENDER_IDX } = metadataKeys;

const uniqueKeys = rows => {
  const keys = rows.map(row => row[1]);
  const uniqueKeys = new Set(keys);
  return uniqueKeys.size === keys.length;
}

export const initData = ({ range, bufferSize = 100, offset=0, renderBufferSize = 0 }) => ({
  //TODO RingBuffer ?
  bufferIdx: { lo: 0, hi: 0 },
  buffer: [],
  bufferSize,
  renderBufferSize,
  rows: [],
  rowCount: 0,
  range,
  offset,
  keys: {
    free: [],
    used: {}
  },
  dataRequired: true
});

const bruteForceResetKeys = (state) => {
  state.keys = {
    free: initKeys(state.range),
    used: {}
  }
  state.rows.forEach(row => {
    const key = state.keys.free.shift();
    row[RENDER_IDX] = key;
    state.keys.used[key] = 1;
  })

}


// This assumes model.meta never changes. If it does (columns etc)
// we will need additional action types to update
export default (state = initData({}), action) => {
  if (action.type === "range") {
    // console.log(`setRange ${JSON.stringify(action.range)}`)
    return setRange(state, action);
  } else if (action.type === "data") {
    const result = setData(state, action)
    if (!uniqueKeys(result.rows)) {
      console.log(`KEY ERROR brute force key reset`);
      // Brute force fix until we eliminate all sources of this error
      bruteForceResetKeys(result)
    }
    return result;
    // return setData(state, action);
  } else if (action.type === "update") {
    return applyUpdates(state, action);
  } else if (action.type === Action.ROWCOUNT) {
    return setSize(state, action);
  } else if (action.type === 'clear') {
    return initData({ range: action.range, bufferSize: action.bufferSize, renderBufferSize: action.renderBufferSize });
  } else {
    throw Error(`GridDataReducer unknown action type ${action.type}`);
  }
}

function setSize(state, { rowCount }) {
  return { ...state, rowCount };
}
function setRange(state, { range }) {
  if (state.range === undefined || range.lo !== state.range.lo || range.hi !== state.range.hi) {
    const [low, high] = rangeLowHigh(range, state.offset, state.rowCount, state.renderBufferSize);
    let [firstBufIdx, lastBufIdx] = firstAndLastIdx(state.buffer);
    const { buffer } = state;

    const bufferIdx = isDataOutOfRange(buffer, low, high, firstBufIdx, lastBufIdx)
      ? { lo: 0, hi: 0 }
      : {
        lo: Math.max(0, low - firstBufIdx),
        hi: Math.min(buffer.length, high - firstBufIdx)
      };

    const direction = scrollDirection(state.range, range);

    reassignKeys(state, bufferIdx, direction);

    if (state.buffer.length > 0 && low >= firstBufIdx && high <= lastBufIdx + 1) {
      const rows = state.buffer.slice(bufferIdx.lo, bufferIdx.hi);

      return {
        ...state,
        buffer,
        bufferIdx,
        rows,
        range,
        dataRequired: (
          ((direction === 'FWD' || direction === 'EXPAND') && (lastBufIdx < state.rowCount + state.offset - 1) && lastBufIdx - high < state.bufferSize / 2) ||
          (direction === 'BWD' && firstBufIdx > state.offset && (low - firstBufIdx < state.bufferSize / 2))) ? true : false
      }


    } else {
      return {
        ...state,
        buffer,
        bufferIdx,
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

function setData(state, action) {
  const { offset, rowCount } = action;

    // console.log(JSON.stringify(action.rows));

  if (!anyRowsInRange(state, action.rows, offset, rowCount)){
    return state;
  }

  const [buffer, bufferIdx, keys, rowsChanged] = addToBuffer(
    state,
    action.rows,
    rowCount,
    offset,
  );

  const fullBufferSize = getFullBufferSize(state.range, state.bufferSize);
  if (buffer.length > fullBufferSize) {
    console.log(`trim ${buffer.length - fullBufferSize} rows from buffer`)
  }

  const newRows = rowsChanged ? buffer.slice(bufferIdx.lo, bufferIdx.hi) : state.rows;
  const rangeCount = state.range.hi - state.range.lo;
  return {
    bufferIdx,
    buffer,
    bufferSize: state.bufferSize,
    renderBufferSize: state.renderBufferSize,
    rows: newRows,
    rowCount,
    offset,
    range: state.range,
    keys,
    dataRequired: newRows.length < rangeCount
  };
}

function addToBuffer(
  state,
  incomingRows,
  size,
  offset = 0,
) {

  const { buffer, bufferSize, range, renderBufferSize, rows, keys } = state;
  let [firstBufIdx, lastBufIdx] = firstAndLastIdx(buffer);
  let [firstRowIdx, lastRowIdx] = firstAndLastIdx(incomingRows);
  const [bufferMin, bufferMax] = bufferMinMax(range, size, bufferSize, offset);
  let { free: freeKeys, used: usedKeys } = keys;
  const [low, high] = rangeLowHigh(range, offset, size, renderBufferSize);


  if (firstRowIdx < bufferMin || lastRowIdx > bufferMax) {
    // lets do this the inefficient way first
    incomingRows = incomingRows.filter(row => row[0] >= bufferMin && row[0] < bufferMax);
    ([firstRowIdx, lastRowIdx] = firstAndLastIdx(incomingRows))

  } /* else if (lastRowIdx < low ) {

    // filling the leading buffer, may or may not include rows within range
    const lo = low - firstRowIdx;
    const hi = high - firstRowIdx;
    const newBuffer = incomingRows.concat(buffer);
    const rowsChanged = lastRowIdx >= low;

    if (rowsChanged) {
      // we need to index the newly inserted rows that are in range
      const end = lo + (lastRowIdx - low) + 1;
      for (let i = lo; i < end; i++) {
        const row = newBuffer[i];
        const key = freeKeys.shift(); // can't we just pop ?
        usedKeys[key] = 1;
        row[RENDER_IDX] = key;
      }
    }

    return [
      newBuffer,
      { lo, hi },
      keys,
      rowsChanged
    ];
  } */

  const scrollDirection = firstBufIdx !== -1 && firstBufIdx < bufferMin
    ? 'FWD'
    : lastBufIdx > bufferMax
      ? 'BWD'
      : '';

  let maxKey = rows.length;
  let row, rowIdx, rowKey;
  let rowsChanged = true;
  let removeFromFrontOfBuffer = 0

  if (scrollDirection === 'FWD') {
    // Forward scrolling
    removeFromFrontOfBuffer = Math.min(buffer.length, bufferMin - firstBufIdx);

    if (lastBufIdx < bufferMin) {
      // we have jumped forward more than a full buffer, release all keys
      freeKeys = initKeys(range);
      usedKeys = {};

    } else {
      // inefficient we only need to loop over inner range
      for (let index = 0; index < removeFromFrontOfBuffer; index++) {
        const rowIdx = buffer[index][IDX];
        if (rowIdx >= range.lo && rowIdx < range.hi) {
          const rowKey = buffer[index][RENDER_IDX]
          freeKeys.push(rowKey);
          usedKeys[rowKey] = undefined;
        }
      }
    }
    if (removeFromFrontOfBuffer === buffer.length) {
      buffer.length = 0;
    } else {
      buffer.splice(0, removeFromFrontOfBuffer);
    }
    firstBufIdx = bufferMin;

  } else if (scrollDirection === 'BWD') {
    // Backward scrolling
    const removeFromEndOfBuffer = Math.min(buffer.length, lastBufIdx - bufferMax + 1);

    if (firstBufIdx >= bufferMax) {
      // we have jumped back more than a full buffer, release all keys
      freeKeys = initKeys(range);
      usedKeys = {};

    } else {
      for (let index = bufferMax - firstBufIdx + 1, i = bufferMax + 1; i < lastBufIdx; i++, index++) {
        if (index >= state.bufferIdx.lo && index < state.bufferIdx.hi) {
          const rowKey = buffer[index][RENDER_IDX];
          freeKeys.push(rowKey);
          usedKeys[rowKey] = undefined;
        }
      }
    }

    if (removeFromEndOfBuffer === buffer.length) {
      buffer.length = 0;
    } else {
      buffer.splice(-removeFromEndOfBuffer, removeFromEndOfBuffer);
    }
    lastBufIdx = bufferMax;
  }

  if (firstBufIdx === -1) {
    firstBufIdx = firstRowIdx;
  }
  if (lastBufIdx === -1) {
    lastBufIdx = lastRowIdx;
  }


  if (firstBufIdx - lastRowIdx === 1){
    const lo = low - firstRowIdx;
    const hi = high - firstRowIdx;
    const newBuffer = incomingRows.concat(buffer);
    const rowsChanged = lastRowIdx >= low;

    if (rowsChanged) {
      // we need to index the newly inserted rows that are in range
      const end = lo + (lastRowIdx - low) + 1;
      for (let i = lo; i < end; i++) {
        const row = newBuffer[i];
        const key = freeKeys.shift(); // can't we just pop ?
        usedKeys[key] = 1;
        row[RENDER_IDX] = key;
      }
    }

    return [
      newBuffer,
      { lo, hi },
      keys,
      rowsChanged
    ];

  }

  const writePosition = firstRowIdx - firstBufIdx;
  if (writePosition < 0) {
    firstBufIdx += writePosition;
  }

  const lo = low - firstBufIdx;
  const hi = high - firstBufIdx;

  if (firstRowIdx >= high || lastRowIdx < low) {
    rowsChanged = false;
  } else if (buffer.length && scrollDirection) {
    reassignKeys(state, { lo, hi }, scrollDirection, removeFromFrontOfBuffer);
  }

  const count = incomingRows.length
  for (let i = 0; i < count; i++) {
    row = incomingRows[i];
    rowIdx = row[IDX];

    const bufIdx = rowIdx - firstBufIdx;

    if (rowIdx >= low && rowIdx < high) {
      if (buffer[bufIdx]) {
        // is this right - it is if we're replacing the same row
        rowKey = buffer[bufIdx][RENDER_IDX];
      } else {
        rowKey = freeKeys.shift();
      }
      if (rowKey === undefined) {
        rowKey = maxKey++;
      }
      usedKeys[rowKey] = 1;
      row[RENDER_IDX] = rowKey;
    }
    if (bufIdx < 0) {
      // not efficient, to be addressed
      buffer.splice(-writePosition - -bufIdx, 0, row);
    } else {
      buffer[bufIdx] = row;
    }
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

