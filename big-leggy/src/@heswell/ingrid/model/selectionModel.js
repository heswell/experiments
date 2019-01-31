import { Selection } from '../types';

export default {

    getInitialState(props){
        return {
            selected: props.selectedRows || [],
            lastTouchIdx: -1,
            focusedIdx: -1
        };
    },

    selectionDiffers :(selected1, selected2) => {
        const len = selected1.length;
        if (len !== selected2.length){
            return true;
        }
        for (let i=0;i<len;i++){
            if (selected1[i] !== selected2[i]){
                return true;
            }
        }
        return false;
    },

    handleItemClick(selectionModel, {selected, lastTouchIdx}, idx, selectedItem, rangeSelect, incrementalSelection){

        if (selectionModel === Selection.SingleRow){
            selected = this.handleRegularSelection(selected, idx);
            lastTouchIdx = idx;
        } else if (rangeSelect){
            selected = this.handleRangeSelection(selected, lastTouchIdx, idx);
        } else if (incrementalSelection || selectionModel === Selection.Checkbox){
            selected = this.handleIncrementalSelection(selected, idx);
            lastTouchIdx = idx;
        } else {
            selected = this.handleRegularSelection(selected, idx);
            lastTouchIdx = idx;
        }

        return {focusedIdx: idx, selected, lastTouchIdx};

    },

    handleRegularSelection(selected, idx){
        const pos = selected.indexOf(idx);
        if (pos === -1){
            return [idx];
        } else {
            return [];
        }
    },

    handleIncrementalSelection(selected, idx){
        const pos = selected.indexOf(idx);
        const len = selected.length;

        if (pos === -1){
            if (len === 0){
                return [idx];
            } else {
                return insert(selected,idx);
            }
        } else {
            if (len === 1){
                return [];
            } else {
                return remove(selected,idx);
            }
        }		
    },

    handleRangeSelection(selected, lastTouchIdx, idx){

        const pos = selected.indexOf(idx);
        const len = selected.length;

        if (pos === -1){

            if (len === 0){
                return makeRange(0,idx);
            } else if (len === 1){
                return makeRange(selected[0],idx);
            } else {
                return applyRange(selected,lastTouchIdx,idx);
            }
        } else {

        }
    },

    handleUpKey(e){
        this.moveSelection(-1,e.shiftKey,e.ctrlKey);
    },

    handleDownKey(e){
        this.moveSelection(1,e.shiftKey,e.ctrlKey);
    },

    handleSpaceKey(){
        let {focusedIdx, selected} = this.state;
        if (focusedIdx !== -1 && selected.indexOf(focusedIdx) === -1){
            selected = insert(selected, focusedIdx);
            this.select(selected, focusedIdx, focusedIdx);
        }
    },

    moveSelection(moveBy, rangeSelect, incrementalSelection){

        const lastTouchIdx = this.state.lastTouchIdx;
        const focusedIdx = this.state.focusedIdx + moveBy;
        const idx = focusedIdx;

        if (focusedIdx < 0 || focusedIdx > this.props.length-1){
            return;
        }

        // This is very specific - must be done some other way
        // making assumptions about existence of displayStart, displayEnd, rowHeight
        if (idx >= this.state.displayEnd-1){
            const {height, rowHeight, width, totalWidth} = this.props;

            const availableHeight = (width > totalWidth) ? height - 15 : height;
            const scrollTop = (idx * rowHeight) - availableHeight;

            // Don't know why we need the 1, but without it, when the Row sets focus,
            // we get an extra 1px scroll event
            const newScrollTop = scrollTop + this.props.rowHeight + 1;
            this.setScroll(newScrollTop);	

        } else if (idx <= this.state.displayStart){
            
            const scrollTop = idx * this.props.rowHeight;
            this.setScroll(scrollTop);

        }

        if (incrementalSelection){
            // do nothing, just let the focus move
        } else {

            const selected = rangeSelect 
                ? this.handleRangeSelection(idx)
                : this.handleRegularSelection(idx);

            const selectedItem = this.refs[idx];
            const selectedData = selectedItem ? selectedItem.props.row : null;

            this.select(selected, rangeSelect ? lastTouchIdx : idx, idx, selectedData);

        }

        this.setState({focusedIdx});

    }

};

function applyRange(arr, lo, hi){

    if (lo > hi) {[lo, hi] = [hi, lo];}

    const ranges = getRanges(arr);
    const newRange = new Range(lo,hi);
    let newRangeAdded = false;
    const ret = [];

    for (let i=0;i<ranges.length;i++){
        const range = ranges[i];

        if (!range.overlaps(newRange)){
            if (range.start < newRange.start){
                for (let idx=range.start;idx<=range.end;idx++){
                    ret.push(idx);
                }
            } else {
                for (let idx=newRange.start;idx<=newRange.end;idx++){
                    ret.push(idx);
                }
                newRangeAdded = true;
                for (let idx=range.start;idx<=range.end;idx++){
                    ret.push(idx);
                }
            }
        } else if (!newRangeAdded){
            for (let idx=newRange.start;idx<=newRange.end;idx++){
                ret.push(idx);
            }
            newRangeAdded = true;
        }
    }

    if (!newRangeAdded){
        for (let idx=newRange.start;idx<=newRange.end;idx++){
            ret.push(idx);
        }
    }

    return ret;
}

function getRanges(arr){

    const ranges = [];
    let range;

    for (let i=0;i<arr.length;i++){
        if (range && range.touches(arr[i])){
            range.extend(arr[i]);
        } else {
            ranges.push(range = new Range(arr[i]));
        }
    }

    return ranges;

}

class Range {

    start;
    end;

    constructor(start, end=start){
        this.start = start;
        this.end = end;
    }

    extend(idx){
        if (idx >= this.start && idx > this.end){
            this.end = idx;
        }
    }

    touches(idx){
        return this.end === idx-1;
    }

    overlaps(that){
        return !(this.end < that.start || this.start > that.end);
    }

    contains(idx){
        return this.start <= idx && this.end >= idx;
    }

    toString(){
        return `[${this.start}:${this.end}]`;
    }
}

function makeRange(lo, hi){
    if (lo > hi) {[lo, hi] = [hi, lo];}

    const range = [];
    for (let idx=lo;idx<=hi;idx++){
        range.push(idx);
    }
    return range;
}

function remove(arr, idx){
    const ret = [];
    for (let i=0;i<arr.length;i++){
        if (idx !== arr[i]){
            ret.push(arr[i]);
        }
    }
    return ret;
}

function insert(arr, idx){
    const ret = [];
    for (let i=0;i<arr.length;i++){
        if (idx !== null && idx < arr[i]){
            ret.push(idx);
            idx = null;
        }
        ret.push(arr[i]);
    }
    if (idx !== null){
        ret.push(idx);
    }
    return ret;

}











































