import { replace, indexOf } from './utils/arrayUtils.mjs';
import {rangeUtils, DataTypes} from '../data/index';
import { metaData } from '../data/store/columnUtils';
import {setFilterColumnMeta} from '../data/store/columnUtils';


const {NULL_RANGE} = rangeUtils;

//TODO can this be merged with DataRange
export class DataRange {
    constructor(range = NULL_RANGE, size = 0, offset = 0, data = []) {
        this.range = range;
        this._size = size;
        this.offset = offset;
        this.data = data;
        this.selected = null;
        this.pendingRange = null;
    }
    get size(){
        return this._size;
    }
    set size(val) {
        if (typeof val !== 'number') {
            console.error(`DataRange.size invalid value ${val}`);
        } else {
            if (this.data.length > val) {
                this.data.length = val;
            }
            this._size = val;
        }
    }
    clear() {
        this._size = 0;
        this.data.length = 0;
        this.range = rangeUtils.resetRange(this.range);
    }
}

export default class Subscription {

    // TODO need to allow for large bufferSize, so we can load entire dataset
    constructor({ columns, range, size = 0, offset = 0 }) {
        this.columns = columns;
        this.meta = metaData(columns);
        this.bufferSize = 100;
        this._data = new DataRange(range, size, offset);
        this._filterData = new DataRange();
    }

    get offset() { return this._data.offset; }
    get size() { return this._data.size; }
    set size(val) { this._data.size = val; }

    reset(dataType, range = NULL_RANGE) {
        console.log(`reset ${dataType} ${JSON.stringify(range)}`);
        const [targetData] = this.getData(dataType);
        targetData.data = [];
        targetData.size = 0;
        targetData.range = range;
    }

    putSnapshot({ size, offset, rows, range: rangeFromServer }) {
        const { range } = this._data;
        this._data = new DataRange(range, size, offset, rows);
        const results = this._data.data.slice(range.lo, range.hi);
        console.log(`[Subscription.putSnapshot] range: ${range.lo} - ${range.hi} in: ${rows.length} rows, out: ${results.length} rows`);
        return results;
    }

    clear() {
        this._data.clear();
    }
    // realign the (buffered) data set to the new range.
    // return any rows that we already have in the buffer and that now come into range.
    putRange({ lo, hi }, dataType = DataTypes.ROW_DATA) {
        console.log(`[Subscription.putRange] range=${lo} - ${hi}`);
        const [targetData, meta] = this.getData(dataType);
        const [out, rowsInRange] = this._putRange(targetData, lo, hi, meta);
        targetData.range = { lo, hi };
        targetData.data = out;
        return rowsInRange;
    }

    // this never changes the range, rows within data are already aligned to (buffered) range
    // we need to be passed in the INDEX_OFFSET so we can detect change
    putRows(rows, offset = 0) {

        const [targetData, meta] = this.getData();
        const results = this._putRows(targetData, rows, meta, offset);

        if (offset !== targetData.offset) {
            targetData.offset = offset;
        }

        console.log(`[Subscription.putRows] in: ${rows.length} rows, out: ${results.rowset.length} rows`);
        return results;
    }

    putData(dataType, { type, rows: data, size }) {
        //onsole.groupCollapsed(`Subscription.putData<${dataType}> [${data.length ? data[0][0]: null} - ${data.length ? data[data.length-1][0]: null}]`);
        if (type === DataTypes.FILTER_BINS){
            return {rowset: data};
        } else {
            const [targetData, meta] = this.getData(dataType);
            targetData.size = size;
            const results = this._putRows(targetData, data, meta);
            return results;
        }
    }

    get rowData() { return this._data; }
    get filterData() { return this._filterData; }
    get filterSize() { return this._filterData.size; }
    set filterSize(val) { this._filterData.size = val; }

    getData(dataType = DataTypes.ROW_DATA) {
        return dataType === DataTypes.ROW_DATA ? [this._data, this.meta] :
            dataType === DataTypes.FILTER_DATA ? [this._filterData, setFilterColumnMeta] :
                [null];
    }

    _putRange(targetData, lo, hi, meta) {
        const { data, range, offset } = targetData;
        const {IDX} = meta;

        const low = lo + offset;
        const high = hi + offset;
        const bufferLow = Math.max(offset, low - this.bufferSize);
        const bufferHigh = high + this.bufferSize;
        const prevLow = range.lo + offset;
        const prevHigh = range.hi + offset;
        const len = data.length;
        const out = [];
        const rowsInRange = [];
        let requiredLow;
        let requiredHigh;
        let row;
        let firstRowIdx = -1;
        let i = 0;

        if (low >= prevHigh || high <= prevLow) {
            requiredLow = low;
            requiredHigh = high;
        } else if (high > prevHigh) {
            requiredLow = prevHigh;
            requiredHigh = high;
        } else {
            requiredLow = low;
            requiredHigh = prevLow;
        }

        while (row === undefined && firstRowIdx < len) {
            firstRowIdx += 1;
            row = data[firstRowIdx];
        }

        for (i = firstRowIdx; i < len; i++) {
            row = data[i];
            // Don't discard any rows if we haven't sent the range to the server.
            // if row is undefined, we have a gap in our data. THis happens when scrolling backwards
            // we have discarded some data when we were going forwards, but the server doesn't know
            // that, so hasn't sent us enough data 
            if (row) {
                let idx = row[IDX];

                if (idx >= bufferHigh) {
                    break;
                } else if (idx >= bufferLow && idx < bufferHigh) { // ok as long as we're scrolling forwards
                    out[idx - bufferLow] = row;

                    if (idx >= requiredLow && idx < requiredHigh) {
                        rowsInRange.push(row);
                    }
                }
            }
        }

        return [out, rowsInRange];

    }

    _putRows(targetData, rows, meta, newOffset = 0) {
        const { data, range, offset } = targetData;
        const {IDX} = meta;
        const { lo, hi } = range;
        const low = lo + offset;
        const high = hi + offset;
        const bufferLow = Math.max(offset, low - this.bufferSize);
        const bufferHigh = high + this.bufferSize;
        const rowset = [];
        const updates = [];

        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            let idx = row[IDX];

            if (lo === 0 && idx < offset) {
                //onsole.log(`Subscription.putRows we are at the top and this.is an insert at the top`);
                data.unshift(row); // unsafe  - temp hack only
                rowset.push(row);
                if (newOffset === offset) {
                    console.warn(`Subscription.putRows would expect a lowered offset in this scenario`);
                }
            } else if (idx >= bufferLow && idx < bufferHigh) {
                let rowIdx = idx - bufferLow;
                data[rowIdx] = row;
                if (idx >= low && idx < high) {
                    rowset.push(row);
                }
            }
        }

        return { rowset, updates };

    }

    putUpdates(updates) {

        const { lo, hi } = this._data.range;
        const low = lo + this.offset;
        const high = hi + this.offset;
        const bufferLow = Math.max(this.offset, low - this.bufferSize);
        const bufferHigh = high + this.bufferSize;
        const updatesInRange = [];

        //onsole.log(`%cSubscription.putUpdates ${updates.length} updates range = lo:${lo} hi: ${hi}`,'color:green;font-eright:bold');

        for (let i = 0; i < updates.length; i++) {
            let update = updates[i];
            let idx = update[0];

            if (idx >= bufferLow && idx < bufferHigh) {
                let row = this._data.data[idx - bufferLow];

                if (row === undefined) {
                    console.log(`%cSubscription.putUpdates update submitted for row that is absent from buffer idx:${idx}
                        range [${lo} - ${hi}] ==> [${low} - ${high}]
                        buffer [${bufferLow} ${bufferHigh}]
                        `, `color:red;font-weight:bold`);
                } else {
                    // keep the rows immutable, these row instances end up going to the client
                    row = row.slice();
                    // apply updates
                    //onsole.log(`client.Subscription receive updates ${JSON.stringify(update)}`);
                    for (let ii = 1; ii < update.length; ii += 2) {
                        // should we double check that the value has actually changed ?
                        row[update[ii]] = update[ii + 1];
                    }

                    if (idx >= low && idx < high) {
                        updatesInRange.push(update);
                    }
                    this._data.data[idx - bufferLow] = row;
                }

            }
        }

        //onsole.log(`%c    ... ${updates.length} updates ${updatesInRange.length} in range `,'color:green;font-eright:bold');
        return { updates: updatesInRange };

    }

    // Replace the group row with toggled group state and return it immediately to the client.
    // We have the opportunity for more caching opportunities here - caching the 
    // child contents of grouped data.
    toggleGroupNode(groupKey) {
        const { KEY, DEPTH } = this.meta;
        const idx = indexOf(this._data.data, row => row[KEY] === groupKey);
        const groupRow = this._data.data[idx];
        return this._data.data[idx] = replace(groupRow, DEPTH, -groupRow[DEPTH]);
    }
}
