import { NULL_RANGE, compareRanges, RangeFlags, getFullRange, getDeltaRange } from './rangeUtils';
import {getCount} from './groupUtils';

const DEPTH = 1;

// IDX = NAV_IDX, COUNT = NAV_COUNT
export const FORWARDS = 0;
export const BACKWARDS = 1;
export default function GroupIterator(groups, navSet, rows, IDX, PARENT, COUNT/*, offset=0*/) {
    let _idx = 0;
    let _grpIdx = null;
    let _rowIdx = null;
    let _direction = FORWARDS;
    let _range = NULL_RANGE;
    let _range_position_lo = [0, null, null];
    let _range_positions = [];
    let _range_position_hi = [null, null, null];

    return {
        get direction(){ return _direction },
        get rangePositions(){ return _range_positions },
        get rangePositionLo(){ return _range_position_lo },
        get rangePositionHi(){ return _range_position_hi },
        setRange,
        currentRange,
        next,
        previous,
        getRangeIndexOfRow,
        injectRow,
        refresh,
        reset
    };

    function injectRow(grpIdx){

        let idx;

        for (let i=0;i<_range_positions.length;i+=3){
            idx = _range_positions[i];
            let grpIdx1 = _range_positions[i+1];
            let rowIdx1 = _range_positions[i+2];

            if (grpIdx1 === grpIdx && rowIdx1 === null){
                return idx;
            }
        }
        const rangeSize = _range.hi - _range.lo;
        if (_range_positions.length / 3 < rangeSize){
            return idx + 1;
        }
        return -1;
    }

    function getRangeIndexOfRow(grpIdx, rowIdx=null){
        const idx = findGrpIndex(_range_positions, grpIdx);
        if (idx !== -1){
            if (rowIdx === null){
                return _range_positions[idx*3];
            } else {
                const group = groups[idx];
                if (group === undefined){
                    console.log(`[GroupIterator] ERROR grpIdx ${grpIdx}
                        ${JSON.stringify(_range_positions,null,2)}
                    `)
                }
                if (group[DEPTH] > 0){
                    // we have the index of the group row within the rowset, the leaf row will
                    // be one of the rows following, order determined by the sortCols
                    const count = group[COUNT];
                    for (let i=idx+5; i<idx+count*3; i+=3){
                        const rowPos = _range_positions[i];
                        const sortRowPos = navSet[rowPos];
                        if (sortRowPos === rowIdx){
                            return Math.floor(i/3);
                        }
                    }
                    return _range_positions[idx];
                }
            }
        }
        return -1;
    }

    function findGrpIndex(list, target){
        for (let i=1; i< list.length; i += 3){
            if (list[i] === target) {
                return Math.floor(i/3);
            }
        }
        return -1;
    }

    function reset(){
        _idx = 0;
        _grpIdx = null;
        _rowIdx = null;
        _direction = FORWARDS;
        _range = NULL_RANGE;
        _range_position_lo = [0, null, null];
        _range_positions = [];
        _range_position_hi = [null, null, null];
    }

    function refresh(_navSet, _IDX, _COUNT){
        navSet = _navSet;
        IDX = _IDX;
        COUNT = _COUNT;
    }

    function currentRange(){
        const rows = [];
        ([_idx, _grpIdx, _rowIdx] = _range_position_lo);
        if (_idx === 0 && _grpIdx === null && _rowIdx === null){
            _idx = -1;
        }
        _range_positions.length = 0;

        let startIdx = _idx;
        let row;
        let i = _range.lo;
        do {
            ([row] = next());
            if (row){
                rows.push(row);
                _idx += 1;
                _range_positions.push(_idx, _grpIdx, _rowIdx);
                i += 1
            }
        } while (row && i < _range.hi)
        if (row){
            const [grpIdx, rowIdx] = [_grpIdx, _rowIdx];
            [row] = next();
            _idx += 1;
            _range_position_hi = [row ? _idx : null, _grpIdx, _rowIdx];
            ([_grpIdx, _rowIdx] = [grpIdx, rowIdx]);
        } else {
            _range_position_hi = [null,null,null];
        }

        return [rows, startIdx+1];

    }

    function setRange(range, useDelta=true){
        const rangeDiff = compareRanges(_range, range);
        const { lo: resultLo, hi: resultHi } = useDelta ? getDeltaRange(_range, range) : getFullRange(range);

        if (rangeDiff === RangeFlags.NULL){
            _range_position_lo = [0,null,null];
            _range_position_hi = [null,null,null];
            _range_positions.length = 0;
            return [[],null];
        } else if (range.lo === _range.lo && useDelta === false){
            // when we're asked for the same range again, rebuild the range
            ([_idx, _grpIdx, _rowIdx] = _range_position_lo);
            _range_positions.length = 0;
        } else {

            if (_direction === FORWARDS && (rangeDiff & RangeFlags.BWD)){
                ([_idx, _grpIdx, _rowIdx] = _range_positions);
            } else if (_direction === BACKWARDS && (rangeDiff & RangeFlags.FWD)){
                ([_idx, _grpIdx, _rowIdx] = _range_positions.slice(-3));
                _idx += 1;
            }

            if (rangeDiff === RangeFlags.FWD){
                skip(range.lo - _range.hi, next);
                _range_positions.length = 0;
            } else if (rangeDiff === RangeFlags.BWD){
                skip(_range.lo - range.hi, previous);
                _range_positions.length = 0;
            }

            const loDiff = range.lo - _range.lo;
            const hiDiff = _range.hi - range.hi;
            // allow for a range that overshoots data
            const missingQuota = (_range.hi - _range.lo) - _range_positions.length/3;

            if (loDiff > 0){
                const removed = _range_positions.splice(0,loDiff*3);
                if (removed.length){
                    _range_position_lo = removed.slice(-3);
                }
            }
            if (hiDiff > 0){
                //TODO allow for scenatio where both lo and HI have changed
                if (hiDiff > missingQuota){
                    const absDiff = hiDiff - missingQuota;
                    const removed = _range_positions.splice(-absDiff*3,absDiff*3);
                    if (removed.length){
                        _range_position_hi = removed.slice(0,3);
                    }
                }
            }

        }

        const rows = [];
        let row;
        let startIdx = null;

        if ((rangeDiff & RangeFlags.REDUCE) === 0){
            if ((rangeDiff & RangeFlags.FWD) || (rangeDiff === RangeFlags.SAME)){
                let i = resultLo;
                startIdx = _idx;
                do {
                    ([row] = next());
                    if (row){
                        rows.push(row);
                        _range_positions.push(_idx, _grpIdx, _rowIdx);
                        i += 1
                        _idx += 1;
                    }
                } while (row && i < resultHi)
                if (row){
                    const [grpIdx, rowIdx] = [_grpIdx, _rowIdx];
                    [row] = next();
                    _range_position_hi = [row ? _idx : null, _grpIdx, _rowIdx];
                    ([_grpIdx, _rowIdx] = [grpIdx, rowIdx]);
                } else {
                    _range_position_hi = [null,null,null];
                }

            } else {
                let i = resultHi - 1;
                do {
                    ([row] = previous());
                    if (row){
                        _idx -= 1;
                        rows.unshift(row);
                        _range_positions.unshift(_idx, _grpIdx, _rowIdx);
                        i -= 1
                    }
                } while (row && i >= resultLo)
                startIdx = _idx;
                if (row){
                    const [grpIdx, rowIdx] = [_grpIdx, _rowIdx];
                    [row] = previous();
                    _range_position_lo = [row ? _idx-1 : 0, _grpIdx, _rowIdx];
                    ([_grpIdx, _rowIdx] = [grpIdx, rowIdx]);
                } else {
                    _range_position_lo = [0,null,null];
                }

            }

        } else {
            // reduced range, adjust the current pos. DIrection can only be a guess, but if it's wrong
            // the appropriate adjustment will be made nest time range is set
            if (rangeDiff & RangeFlags.FWD){
                console.log(`adjust thye idx`);
                ([_idx, _grpIdx, _rowIdx] = _range_positions.slice(-3));
                _idx += 1;
            } else {
                ([_idx, _grpIdx, _rowIdx] = _range_positions);
            }
        }

        _range = range;
        return [rows, startIdx];
    }

    function skip(n, fn){

        let i=0;
        let row;
        do {
            [row] = fn();
            if (fn === next){
                _idx += 1;
                i += 1;
            } else {
                _idx -= 1;
                i += 1;
            }
        } while (row && i < n)
        if (fn === next){
            _range_position_lo = [_idx-1, _grpIdx, _rowIdx];
        } else {
            _range_position_hi = [_idx, _grpIdx, _rowIdx];
        }
    }

    function next(grpIdx=_grpIdx, rowIdx=_rowIdx){
        _direction = FORWARDS;
        if (grpIdx === null){
            grpIdx = -1;
            do {
                grpIdx += 1;
            } while (grpIdx < groups.length && (
                (getCount(groups[grpIdx],COUNT) === 0)
            ));

            if (grpIdx >= groups.length){
                return [null,_grpIdx = null, _rowIdx = null];
            } else {
                return [groups[grpIdx], _grpIdx = grpIdx, _rowIdx = null];
            }
        } else if (grpIdx >= groups.length){
            return [null,_grpIdx = null, _rowIdx = null];
        } else {
            let groupRow = groups[grpIdx];
            const depth = groupRow[DEPTH];
            const count = getCount(groupRow,COUNT);
            // Note: we're unlikely to be passed the row if row count is zero
            if (depth === 1 && count !== 0 && (rowIdx === null || rowIdx < count - 1)){
                rowIdx = rowIdx === null ? 0 : rowIdx + 1;
                const idx = navSet[groupRow[IDX]+rowIdx];
                const [i, ...rest] = rows[idx];
                return [[i,0,0,...rest], _grpIdx = grpIdx, _rowIdx = rowIdx === null ? 0 : rowIdx];
            } else if (depth > 0){

                do {
                    grpIdx += 1;
                } while (grpIdx < groups.length && (
                    (getCount(groups[grpIdx],COUNT) === 0)
                ));
                if (grpIdx >= groups.length){
                    return [null,_grpIdx = null, _rowIdx = null];
                } else {
                    return [groups[grpIdx], _grpIdx = grpIdx, _rowIdx = null];
                }
            } else {
                const absDepth = Math.abs(depth);
                do {
                    grpIdx += 1;
                } while (grpIdx < groups.length && (
                    (Math.abs(groups[grpIdx][DEPTH]) < absDepth) ||
                    (getCount(groups[grpIdx],COUNT) === 0)
                ));
                if (grpIdx >= groups.length){
                    return [null,_grpIdx = null, _rowIdx = null];
                } else {
                    return [groups[grpIdx], _grpIdx = grpIdx, _rowIdx = null];
                }
            }
        }
    }

    function previous(grpIdx=_grpIdx, rowIdx=_rowIdx){
        _direction = BACKWARDS;
        if (grpIdx !== null && groups[grpIdx][DEPTH] === 1 && typeof rowIdx === 'number'){
            let lastGroup = groups[grpIdx];
            if (rowIdx === 0){
                return [lastGroup, _grpIdx = grpIdx, _rowIdx = null];
            } else {
                rowIdx -= 1;
                const navIdx = lastGroup[IDX] + rowIdx;
                const [i, ...rest] = rows[navSet[navIdx]];
                return [[i,0,0,...rest], _grpIdx = grpIdx, _rowIdx = rowIdx];
            }
        } else {
            if (grpIdx === null){
                grpIdx = groups.length-1;
            } else if (grpIdx === 0) {
                return [null, _grpIdx = null, _rowIdx = null];
            } else {
                grpIdx -= 1;
            }
            let lastGroup = groups[grpIdx];
            if (lastGroup[DEPTH] === 1){
                rowIdx = getCount(lastGroup, COUNT) - 1;
                const navIdx = lastGroup[IDX] + rowIdx;
                const [i, ...rest] = rows[navSet[navIdx]];
                return [[i,0,0,...rest], _grpIdx = grpIdx, _rowIdx = rowIdx];
            }
            while (lastGroup[PARENT] !== null && groups[lastGroup[PARENT]][DEPTH] < 0){
                grpIdx = lastGroup[PARENT];
                lastGroup = groups[grpIdx];
            }
            return [lastGroup, _grpIdx = grpIdx, _rowIdx = null];
        }
    }
}
