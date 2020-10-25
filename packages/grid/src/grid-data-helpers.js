import { metadataKeys } from "@heswell/utils";

const { IDX, RENDER_IDX } = metadataKeys;

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
export function reassignKeys(state, { lo, hi }) {

  // assign keys to the items moving into range
  const { buffer, bufferIdx, keys: { free: freeKeys, used: usedKeys } } = state;
  let maxKey = state.rows.length;

  // rows that have moved out of range need to give back their key
  if (lo > bufferIdx.lo) {
    // reclaim keys
    for (let i = bufferIdx.lo; i < lo; i++) {
      // we can just leave the key in the out-of-range row, it will be reassigned a key if it comes back into range
      const rowKey = buffer[i][RENDER_IDX];
      freeKeys.push(rowKey);
      usedKeys[rowKey] = undefined;
    }
  } else if (lo < bufferIdx.lo) {
    for (let i = lo; i < bufferIdx.lo; i++) {
      // we can just leave the key in the out-of-range row, it will be reassigned a key if it comes back into range
      const rowKey = buffer[i][RENDER_IDX];
      freeKeys.push(rowKey);
      usedKeys[rowKey] = undefined;
    }
  }

  // rows that have moved into range need to be assigned key
  if (hi > bufferIdx.hi) {
    const stop = Math.min(hi, buffer.length)
    // assign keys
    for (let i = bufferIdx.hi; i < stop; i++) {
      let rowKey = freeKeys.shift();
      if (rowKey === undefined) {
        rowKey = maxKey++;
      }
      usedKeys[rowKey] = 1;
      buffer[i][RENDER_IDX] = rowKey;
    }
  } else if (hi < bufferIdx.hi) {
    for (let i = hi; i < bufferIdx.hi; i++) {
      let rowKey = freeKeys.shift();
      if (rowKey === undefined) {
        rowKey = maxKey++;
      }
      usedKeys[rowKey] = 1;
      buffer[i][RENDER_IDX] = rowKey;
    }
  }

}