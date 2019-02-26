import {getDeltaRange, getFullRange, NULL_RANGE} from './rangeUtils';
import { metaData } from './columnUtils';

export default class BaseRowSet {

    constructor(columns, offset=0){
        this.offset = offset;
        this.baseOffset = offset;
        this.range = NULL_RANGE;
        this.selectedIndices = [];
        this.columns = columns;
        this.currentFilter = null;
        this.filterSet = null;
    }

    setRange(range, useDelta=true){
        const { lo, hi } = useDelta ? getDeltaRange(this.range, range) : getFullRange(range);
        const resultset = this.slice(lo,hi);
        this.range = range;
        return {
            rows: resultset,
            range,
            size: this.size,
            offset: this.offset,
            selectedIndices: this.selectedIndices
        };
    }

    currentRange(){
        const { lo, hi } = this.range;
        const resultset = this.slice(lo, hi);
        return {
            rows: resultset,
            range: this.range,
            size: this.size,
            offset: this.offset,
            selectedIndices: this.selectedIndices
        };
    }

    selectNavigationSet(useFilter){
        const { COUNT, IDX_POINTER, FILTER_COUNT, NEXT_FILTER_IDX } = metaData(this.columns);
        return useFilter
            ? [this.filterSet, NEXT_FILTER_IDX, FILTER_COUNT]
            : [this.sortSet, IDX_POINTER, COUNT];
    }
    
}
