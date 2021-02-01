import { metadataKeys } from "@heswell/utils";

const { RENDER_IDX } = metadataKeys;

export const isDataOutOfRange = (buffer, low, high, firstBufIdx, lastBufIdx) =>
  buffer.length == 0 || low > lastBufIdx || high < firstBufIdx;


export function anyRowsInRange(state, rows, offset, rowCount) {
  let [firstRowIdx, lastRowIdx] = firstAndLastIdx(rows);
  const { range, bufferSize } = state;
  const [bufferMin, bufferMax] = bufferMinMax(range, rowCount, bufferSize, offset);
  return lastRowIdx >= bufferMin && firstRowIdx < bufferMax;
}

export const initKeys = ({ hi, lo }) => {
  return new Array(hi - lo).fill(0).map((_, i) => i)
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

export const getFreedKeys = ({ lo: oldLo, hi: oldHi }, { lo: newLo, hi: newHi }) => {
  const freedKeys = [];

  if (oldLo !== newLo || oldHi !== newHi) {
    if (newHi <= oldLo || newLo >= oldHi) {
      // all old keys are freed
      for (let i = oldLo; i < oldHi; i++) {
        freedKeys.push(i);
      }
    } else {
      if (oldLo < newLo) {
        for (let i = oldLo; i < newLo; i++) {
          freedKeys.push(i);
        }
      }
      if (oldHi > newHi) {
        for (let i = newHi; i < oldHi; i++) {
          freedKeys.push(i)
        }
      }
    }
  }
  return freedKeys;
}

export const getNewEntriesIntoRange = ({ lo: oldLo, hi: oldHi }, { lo: newLo, hi: newHi }) => {

  const newEntries = [];

  if (oldLo !== newLo || oldHi !== newHi) {
    if (newHi <= oldLo || newLo >= oldHi) {
      // all keys are new entries
      for (let i = newLo; i < newHi; i++) {
        newEntries.push(i);
      }
    } else {
      if (newLo < oldLo) {
        for (let i = newLo; i < oldLo; i++) {
          newEntries.push(i);
        }
      }
      if (newHi > oldHi) {
        for (let i = oldHi; i < newHi; i++) {
          newEntries.push(i)
        }
      }
    }
  }
  return newEntries;

}

export const  getBufferIdx = (buffer, low, high, firstBufIdx, lastBufIdx) => {
  return isDataOutOfRange(buffer, low, high, firstBufIdx, lastBufIdx)
  ? { lo: 0, hi: 0 }
  : {
    lo: Math.max(0, low - firstBufIdx),
    hi: Math.min(buffer.length, high - firstBufIdx)
  };

}

export function rangeLowHigh(range, offset, size, renderBufferSize = 0) {
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

export const getFullBufferSize = (range, rowCount, bufferSize, offset = 0) => {
  const leadCount = Math.min(bufferSize, range.lo - offset);
  const trailCount = Math.min(bufferSize, rowCount - range.hi - offset);
  return range.hi - range.lo + leadCount + trailCount;;
}

export function reassignKeys(state, bufferIdx) {
  const {buffer, keys} = state;
  const freedKeys = getFreedKeys(state.bufferIdx, bufferIdx);
  for (let bufferIdx of freedKeys){
    const rowKey = buffer[bufferIdx][RENDER_IDX];
    keys.free.push(rowKey);
    keys.used[rowKey] = undefined;
  }

  const newEntries = getNewEntriesIntoRange(state.bufferIdx, bufferIdx)
  for (let bufferIdx of newEntries){
    let rowKey = keys.free.shift();
    if (rowKey === undefined) {
      rowKey = keys.next++;
    }
    keys.used[rowKey] = 1;
    buffer[bufferIdx][RENDER_IDX] = rowKey;
  }
}

export function scrollDirection(range1, range2) {
  if (range1 === null) {
    return 'INIT';
  } else if (range1.lo === range2.lo && range2.hi > range1.hi) {
    return 'EXPAND';
  } else if (range1.hi === range2.hi && range2.lo < range1.lo) {
    return 'EXPAND';
  } else if (range2.lo > range1.lo) {
    return 'FWD';
  } else if (range2.lo < range1.lo) {
    return 'BWD';
  } else {
    return 'UNKNOWN'
  }
}