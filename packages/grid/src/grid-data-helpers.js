import { metadataKeys } from "@heswell/utils";

const { RENDER_IDX } = metadataKeys;

export const isDataOutOfRange = (buffer, low, high, firstBufIdx, lastBufIdx) => 
 buffer.length == 0 || low > lastBufIdx || high < firstBufIdx;


export function anyRowsInRange(state, rows, offset, rowCount){
  let [firstRowIdx, lastRowIdx] = firstAndLastIdx(rows);
  const {range, bufferSize} = state;
  const [bufferMin, bufferMax] = bufferMinMax(range, rowCount, bufferSize, offset);
  return lastRowIdx >= bufferMin && firstRowIdx < bufferMax;
}

export const initKeys = ({hi, lo}) => {
  return new Array(hi - lo).fill(0).map((_,i) => i)
}

export function firstAndLastIdx(rows) {
  const count = rows.length;
  if (count === 0) {
    return [-1, -1];
  } else {
    const [idx1] = rows[0];
    const [idx2] = rows[count - 1];
    return [idx1, idx2]
  }
}

export function rangeLowHigh(range, offset, size, renderBufferSize=0) {
  return [
    Math.max(offset, range.lo + offset - renderBufferSize), 
    Math.min(range.hi + renderBufferSize + offset, size + offset)
  ];
}

export function bufferMinMax(range, size, bufferSize, offset) {
  return [
    Math.max(offset, (range.lo + offset) - bufferSize),
    Math.min(size + offset + bufferSize, range.hi + offset + bufferSize)]
}

export const getFullBufferSize = (range, rowCount, bufferSize, offset=0) => {
  const leadCount = Math.min(bufferSize, range.lo-offset);
  const trailCount = Math.min(bufferSize, rowCount - range.hi - offset);
  return range.hi - range.lo + leadCount + trailCount;;
}

export function reassignKeys(state, { lo, hi }, direction, idxOffset=0) {
  // What about scenario where range increases/shrinks ?
  // assign keys to the items moving into range
  const { buffer, bufferIdx, keys: { free: freeKeys, used: usedKeys } } = state;
  let maxKey = state.rows.length;
  

  // rows that have moved out of range need to give back their key, unless we have already removed them,
  // in which case we will have already retrieved the key
  if (direction === 'FWD') {
    let start = Math.max(0, bufferIdx.lo - idxOffset);
    let stop = Math.min(lo, bufferIdx.hi-idxOffset);
    for (let i = start; i < stop; i++) {
      if (buffer[i]){
        const rowKey = buffer[i][RENDER_IDX];
        freeKeys.push(rowKey);
        usedKeys[rowKey] = undefined;
      }
    }

    // assign keys
    start = Math.max(lo, bufferIdx.hi - idxOffset);
    stop = Math.min(hi, buffer.length)
    for (let i = start; i < stop; i++) {
      if (buffer[i]){
        let rowKey = freeKeys.shift();
        if (rowKey === undefined) {
          rowKey = maxKey++;
        }
        usedKeys[rowKey] = 1;
        buffer[i][RENDER_IDX] = rowKey;
      }
    }

  } else if (direction === 'BWD') {

    const start = Math.max(hi, bufferIdx.lo);
    // this isn't great, we can be looping over a range which has been entirely removed
    for (let i = start; i < bufferIdx.hi; i++) {
      if (buffer[i]){
        const rowKey = buffer[i][RENDER_IDX];
        freeKeys.push(rowKey);
        usedKeys[rowKey] = undefined;
      }
    }

    const stop = Math.min(hi, bufferIdx.lo)
    for (let i = lo; i < stop; i++) {
      if (buffer[i]){
        let rowKey = freeKeys.shift();
        if (rowKey === undefined) {
          rowKey = maxKey++;
        }
        usedKeys[rowKey] = 1;
        buffer[i][RENDER_IDX] = rowKey;
      }
    }
  } else if (direction === 'EXPAND'){
    if (hi > bufferIdx.hi){
      for (let i=bufferIdx.hi; i< hi; i++){
        const rowKey = maxKey++;
        usedKeys[rowKey] = 1;
        buffer[i][RENDER_IDX] = rowKey;
      }
    } else {
      debugger;
     }
  }

}

export function scrollDirection(range1, range2) {
  if (range1 === null) {
    return 'INIT';
  } else if (range1.lo === range2.lo && range2.hi > range1.hi){
    return 'EXPAND';
  } else if (range1.hi === range2.hi && range2.lo < range1.lo){
    return 'EXPAND';
  } else if (range2.lo > range1.lo) {
    return 'FWD';
  } else if (range2.lo < range1.lo) {
    return 'BWD';
  } else {
    return 'UNKNOWN'
  }
}