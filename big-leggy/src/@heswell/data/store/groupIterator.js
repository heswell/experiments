import { NULL_RANGE, compareRanges, RangeFlags, getFullRange, getDeltaRange } from './rangeUtils';
import {getCount, groupRows} from './groupUtils';


const RANGE_POS_TUPLE_SIZE = 3;

// IDX = NAV_IDX, COUNT = NAV_COUNT
export const FORWARDS = 0;
export const BACKWARDS = 1;
export default function GroupIterator(groups, navSet, rows, IDX, COUNT, meta) {
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
        setRange,
        currentRange,
        getRangeIndexOfRow,
        injectRow,
        refresh,
        reset
    };

    function getAbsRowIdx(group, relRowIdx){
        return navSet[group[IDX] + relRowIdx];
    }

    function injectRow(grpIdx){

        let idx;

        for (let i=0;i<_range_positions.length;i+=RANGE_POS_TUPLE_SIZE){
            idx = _range_positions[i];
            let grpIdx1 = _range_positions[i+1];
            let rowIdx1 = _range_positions[i+2];

            if (grpIdx1 === grpIdx && rowIdx1 === null){
                return idx;
            }
        }
        const rangeSize = _range.hi - _range.lo;
        if (_range_positions.length / RANGE_POS_TUPLE_SIZE < rangeSize){
            return idx + 1;
        }
        return -1;
    }

    // grpIdx is always the top-level group, however many levels of
    // grouping may be present
    // why dont we add the absRowIdx to simplify lookup
    function getRangeIndexOfRow(grpIdx, rowIdx=null){
        const [groupRowFound, idx] = getRangeIndexOfGroup(_range_positions, grpIdx);
        if (rowIdx === null){
            return groupRowFound ? idx : -1;
        } else if (idx === -1){
            return -1;
        } else {
            const group = groups[grpIdx];
            if (group === undefined){
                console.error(`[GroupIterator] ERROR grpIdx ${grpIdx}
                    ${JSON.stringify(_range_positions,null,2)}
                `)
            }

            const start = (idx+1) * RANGE_POS_TUPLE_SIZE;
            // this test is going to fail beyond 1 level of grouping if base group is scrolled
            // out of viewport]
            for (let i=start; _range_positions[i+1] === grpIdx; i+=RANGE_POS_TUPLE_SIZE){
                const relRowIdx = _range_positions[i+2];
                if (rowIdx === getAbsRowIdx(group, relRowIdx)){
                    return i/RANGE_POS_TUPLE_SIZE;
                }
            }

        }
        return -1;
    }

    function getRangeIndexOfGroup(list, target){
        for (let i=0; i< list.length; i += RANGE_POS_TUPLE_SIZE){
            if (list[i+1] === target) {
                if (list[i+2] === null){
                    return [true, i/RANGE_POS_TUPLE_SIZE];
                } else {
                    // happend when we have scrolled - the group row is out of viewport
                    return [false, i/RANGE_POS_TUPLE_SIZE];
                }
            }
        }
        return [false,-1];
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
                ([_idx, _grpIdx, _rowIdx] = _range_positions.slice(-RANGE_POS_TUPLE_SIZE));
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
            const missingQuota = (_range.hi - _range.lo) - _range_positions.length/RANGE_POS_TUPLE_SIZE;

            if (loDiff > 0){
                const removed = _range_positions.splice(0,loDiff*RANGE_POS_TUPLE_SIZE);
                if (removed.length){
                    _range_position_lo = removed.slice(-RANGE_POS_TUPLE_SIZE);
                }
            }
            if (hiDiff > 0){
                //TODO allow for scenatio where both lo and HI have changed
                if (hiDiff > missingQuota){
                    const absDiff = hiDiff - missingQuota;
                    const removed = _range_positions.splice(-absDiff*RANGE_POS_TUPLE_SIZE,absDiff*RANGE_POS_TUPLE_SIZE);
                    if (removed.length){
                        _range_position_hi = removed.slice(0,RANGE_POS_TUPLE_SIZE);
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
                    // confusing...next() increments _rowIdx
                    ([row] = next());
                    if (row){
                        console.log(`row = ${JSON.stringify(row)}`)
                        rows.push(row);
                        //TODO why not add the absRowIdx here
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
                ([_idx, _grpIdx, _rowIdx] = _range_positions.slice(-RANGE_POS_TUPLE_SIZE));
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
            const depth = groupRow[meta.DEPTH];
            const count = getCount(groupRow,COUNT);
            // Note: we're unlikely to be passed the row if row count is zero
            if (depth === 1 && count !== 0 && (rowIdx === null || rowIdx < count - 1)){
                rowIdx = rowIdx === null ? 0 : rowIdx + 1;
                const absRowIdx = getAbsRowIdx(groupRow, rowIdx)
                // the equivalent of project row
                const row = rows[absRowIdx].slice()
                row[meta.IDX] = absRowIdx;
                row[meta.DEPTH] = 0;
                row[meta.COUNT] = 0;
                row[meta.KEY] = row[0]; // assume keyfieldis 0 for now
                return [row, _grpIdx = grpIdx, _rowIdx = rowIdx === null ? 0 : rowIdx];
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
                    (Math.abs(groups[grpIdx][meta.DEPTH]) < absDepth) ||
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
        if (grpIdx !== null && groups[grpIdx][meta.DEPTH] === 1 && typeof rowIdx === 'number'){
            let lastGroup = groups[grpIdx];
            if (rowIdx === 0){
                return [lastGroup, _grpIdx = grpIdx, _rowIdx = null];
            } else {
                rowIdx -= 1;
                const absRowIdx = getAbsRowIdx(lastGroup, rowIdx)
                const row = rows[absRowIdx].slice()
                // row[meta.IDX] = idx;
                row[meta.DEPTH] = 0;
                row[meta.COUNT] = 0;
                row[meta.KEY] = row[0]; // assume keyfieldis 0 for now

                return [row, _grpIdx = grpIdx, _rowIdx = rowIdx];
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
            if (lastGroup[meta.DEPTH] === 1){
                rowIdx = getCount(lastGroup, COUNT) - 1;
                const absRowIdx = getAbsRowIdx(lastGroup, rowIdx)
                const row = rows[absRowIdx].slice()
                // row[meta.IDX] = idx;
                row[meta.DEPTH] = 0;
                row[meta.COUNT] = 0;
                row[meta.KEY] = row[0]; // assume keyfieldis 0 for now

                return [row, _grpIdx = grpIdx, _rowIdx = rowIdx];
            }
            while (lastGroup[meta.PARENT_IDX] !== null && groups[lastGroup[meta.PARENT_IDX]][meta.DEPTH] < 0){
                grpIdx = lastGroup[meta.PARENT_IDX];
                lastGroup = groups[grpIdx];
            }
            return [lastGroup, _grpIdx = grpIdx, _rowIdx = null];
        }
    }
}
