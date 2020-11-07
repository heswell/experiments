
import { metadataKeys, update as updateRows } from "@heswell/utils";
import { bufferMinMax, firstAndLastIdx, range as $range, rangeLowHigh, reassignKeys, scrollDirection } from './grid-data-helpers';
import * as Action from "./grid-data-actions";

const { IDX, RENDER_IDX } = metadataKeys;

/** @type {(any) =>  GridData} */
export const initData = ({ range, bufferSize = 100, renderBufferSize=0 }) => ({
  //TODO RingBuffer ?
  bufferIdx: { lo: 0, hi: 0 },
  buffer: [],
  bufferSize,
  renderBufferSize,
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
  console.log(action.type)
  if (action.type === "range") {
    return setRange(state, action);
  } else if (action.type === "data") {
    return setData(state, action);
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
//TODO we HAVE to remove out=of-range rows and add empty placeholders
/** @type {DataReducer} */
function setRange(state, { range }) {
  if (state.range === undefined || range.lo !== state.range.lo || range.hi !== state.range.hi) {
    console.log(`setRange ${range.lo} - ${range.hi} buffer length ${state.buffer.length} bufferSize: ${state.bufferSize} renderBufferSize ${state.renderBufferSize}`)
    const [low, high] = rangeLowHigh(range, state.offset, state.rowCount);
    let [firstBufIdx, lastBufIdx] = firstAndLastIdx(state.buffer);

    if (low >= firstBufIdx && high <= lastBufIdx + 1) {

      const direction = scrollDirection(state.range, range);

      // we have all required data in buffer already
      const bufferIdx = {
        lo: low - firstBufIdx,
        hi: high - firstBufIdx
      };

      // do we have rows available to fill renderBuffer ?
      if (state.renderBufferSize){
        if (bufferIdx.lo > 0){
          console.log(`we have ${bufferIdx.lo} spare leading data rows and renderBufferSize = ${state.renderBufferSize}`)
        }
        if (bufferIdx.hi < state.buffer.length){
          console.log(`we have ${state.buffer.length - bufferIdx.hi} spare trailing data rows and renderBufferSize = ${state.renderBufferSize}`)
        }
      }

      reassignKeys(state, bufferIdx, direction);

      const rows = state.buffer.slice(bufferIdx.lo, bufferIdx.hi);

      return {
        ...state,
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

// TODO we must not assume that the server will send buffer data
/** @type {DataReducer} */
function setData(state, action) {
  const { offset, rowCount } = action;
  const [buffer, bufferIdx, keys, rowsChanged] = addToBuffer(
    state,
    action.rows,
    rowCount,
    offset,
  );

  return {
    bufferIdx,
    buffer,
    bufferSize: state.bufferSize,
    renderBufferSize: state.renderBufferSize,
    rows: rowsChanged ? buffer.slice(bufferIdx.lo, bufferIdx.hi) : state.rows,
    rowCount,
    offset,
    range: state.range,
    keys,
    dataRequired: false
  };
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

  const scrollDirection = firstBufIdx !== -1 && firstBufIdx < bufferMin
    ? 'FWD' 
    : lastBufIdx > bufferMax
      ? 'BWD'
      : '';

  let maxKey = rows.length;
  let row, rowIdx, rowKey;
  let rowsChanged = true;
  let removedFromFrontOfBuffer = 0

  if (scrollDirection === 'FWD') {
    // Forward scrolling
    removedFromFrontOfBuffer = Math.min(buffer.length, bufferMin - firstBufIdx);
    // inefficient we only need to loop over inner ranfe
    for (let index = 0, i = firstBufIdx; i < bufferMin; i++, index++) {
      if (index >= state.bufferIdx.lo && index < state.bufferIdx.hi) {
        const rowKey = buffer[index][RENDER_IDX];
        freeKeys.push(rowKey);
        usedKeys[rowKey] = undefined;
      }
    }
    buffer.splice(0, removedFromFrontOfBuffer);
    firstBufIdx = bufferMin;

  } else if (scrollDirection === 'BWD') {
    // Backward scrolling
    const doomedCount = Math.min(buffer.length, lastBufIdx - bufferMax + 1);
    for (let index = bufferMax - firstBufIdx + 1, i = bufferMax + 1; i < lastBufIdx; i++, index++) {

      if (index >= state.bufferIdx.lo && index < state.bufferIdx.hi) {
        const rowKey = buffer[index][RENDER_IDX];
        freeKeys.push(rowKey);
        usedKeys[rowKey] = undefined;
      }
    }
    if (doomedCount === buffer.length) {
      buffer.length = 0;
    } else {
      buffer.splice(-doomedCount, doomedCount);
    }
    lastBufIdx = bufferMax;
  }

  if (firstBufIdx === -1) {
    firstBufIdx = firstRowIdx;
  }
  if (lastBufIdx === -1) {
    lastBufIdx = lastRowIdx;
  }


  const writePosition = firstRowIdx - firstBufIdx;
  if (writePosition < 0) {
    firstBufIdx += writePosition;
  }

  const lo = low - firstBufIdx;
  const hi = high - firstBufIdx;

  if (firstRowIdx >= high || lastRowIdx < low) {
    rowsChanged = false;
  } else if (buffer.length){

    reassignKeys(state, { lo, hi }, scrollDirection, removedFromFrontOfBuffer);
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
      }
      usedKeys[rowKey] = 1;
      row[RENDER_IDX] = rowKey;
    }
    if (idx < 0) {
      // not efficient, to be addressed
      buffer.splice(-writePosition - -idx, 0, row);
    } else {
      buffer[idx] = row;
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

