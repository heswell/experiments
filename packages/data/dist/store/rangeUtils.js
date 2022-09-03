const NULL_RANGE = { lo: 0, hi: 0 };
function getDeltaRange(oldRange, newRange) {
  const { lo: oldLo, hi: oldHi } = oldRange;
  const { lo: newLo, hi: newHi } = newRange;
  if (newLo >= oldLo && newHi <= oldHi) {
    return { lo: newHi, hi: newHi };
  } else if (newLo >= oldHi || newHi < oldLo) {
    return { lo: newLo, hi: newHi };
  } else if (newLo === oldLo && newHi === oldHi) {
    return { lo: oldHi, hi: oldHi };
  } else {
    return {
      lo: newLo < oldLo ? newLo : oldHi,
      hi: newHi > oldHi ? newHi : oldLo
    };
  }
}
function resetRange({ lo, hi, bufferSize = 0 }) {
  return {
    lo: 0,
    hi: hi - lo,
    bufferSize,
    reset: true
  };
}
function getFullRange({ lo, hi, bufferSize = 0 }) {
  return {
    lo: Math.max(0, lo - bufferSize),
    hi: hi + bufferSize
  };
}
function withinRange(range, index, offset = 0) {
  return index - offset >= range.lo && index - offset < range.hi;
}
const SAME = 0;
const FWD = 2;
const BWD = 4;
const CONTIGUOUS = 8;
const OVERLAP = 16;
const REDUCE = 32;
const EXPAND = 64;
const NULL = 128;
const RangeFlags = {
  SAME,
  FWD,
  BWD,
  CONTIGUOUS,
  OVERLAP,
  REDUCE,
  EXPAND,
  NULL
};
RangeFlags.GAP = ~(CONTIGUOUS | OVERLAP | REDUCE);
function compareRanges(range1, range2) {
  if (range2.lo === 0 && range2.hi === 0) {
    return NULL;
  } else if (range1.lo === range2.lo && range1.hi === range2.hi) {
    return SAME;
  } else if (range2.hi > range1.hi) {
    if (range2.lo > range1.hi) {
      return FWD;
    } else if (range2.lo === range1.hi) {
      return FWD + CONTIGUOUS;
    } else if (range2.lo >= range1.lo) {
      return FWD + OVERLAP;
    } else {
      return EXPAND;
    }
  } else if (range2.lo < range1.lo) {
    if (range2.hi < range1.lo) {
      return BWD;
    } else if (range2.hi === range1.lo) {
      return BWD + CONTIGUOUS;
    } else if (range2.hi > range1.lo) {
      return BWD + OVERLAP;
    } else {
      return EXPAND;
    }
  } else if (range2.lo > range1.lo) {
    return REDUCE + FWD;
  } else {
    return REDUCE + BWD;
  }
}
export {
  NULL_RANGE,
  RangeFlags,
  compareRanges,
  getDeltaRange,
  getFullRange,
  resetRange,
  withinRange
};
//# sourceMappingURL=rangeUtils.js.map
