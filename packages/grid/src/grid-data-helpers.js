import { metadataKeys } from "@heswell/utils";

const { RENDER_IDX } = metadataKeys;

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

export function rangeLowHigh(range, offset, size) {
  return [range.lo + offset, Math.min(range.hi + offset, size + offset)]
}

export function bufferMinMax(range, size, bufferSize, offset) {
  return [
    Math.max(offset, (range.lo + offset) - bufferSize),
    Math.min(size + offset + bufferSize, range.hi + offset + bufferSize)]
}

// debug pront
export function range(rows) {
  return rows.length === 0
    ? '[]'
    : rows.length === 1
      ? `[${rows[0][0]}]`
      : `[${rows[0][0]} ... ${rows[rows.length - 1][0]}]`
}

// Given a new bufferIdx, compare with the existing bufferIdx,
// see which rows are moving into/out of range and transfer keys
// accordingly
// The idxOffset allows for leading buffer items which have been removed, 
// requiring an adjustment to the original bufferIdx
export function reassignKeys(state, { lo, hi }, direction, idxOffset=0) {
  // What about scenario where range increases/shrinks ?
  // assign keys to the items moving into range
  const { buffer, bufferIdx, keys: { free: freeKeys, used: usedKeys } } = state;
  let maxKey = state.rows.length;

  // rows that have moved out of range need to give back their key, unless we have already removed them,
  // in which case we will have already retrieved the key
  if (direction === 'FWD') {
    // reclaim keys, careful not to go beyond the range where we have keys
    const start = Math.max(0, bufferIdx.lo - idxOffset);
    const stop = Math.min(lo, bufferIdx.hi-idxOffset);
    for (let i = start; i < stop; i++) {
      // we can just leave the key in the out-of-range row, it will be reassigned a key if it comes back into range
      if (buffer[i]){
        const rowKey = buffer[i][RENDER_IDX];
        freeKeys.push(rowKey);
        usedKeys[rowKey] = undefined;
      }
    }
  } else if (direction === 'BWD') {
    const start = Math.max(hi, bufferIdx.lo);
    // this isn't great, we can be looping over a ranbge which has been entirely removed
    for (let i = start; i < bufferIdx.hi; i++) {
      if (buffer[i]){
        const rowKey = buffer[i][RENDER_IDX];
        freeKeys.push(rowKey);
        usedKeys[rowKey] = undefined;
      }
    }
  }

  // rows that have moved into range need to be assigned key
  if (direction === 'FWD') {
    // assign keys
    const stop = Math.min(hi, buffer.length)
    const start = Math.max(lo, bufferIdx.hi - idxOffset);
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
  }

}