import { NULL_RANGE, resetRange, withinRange } from './rangeUtils';
import {RowSet, GroupRowSet} from './rowset';
import {buildColumnMap, toColumn ,getFilterType} from './columnUtils';
import {includesNoValues} from './filterUtils';
import UpdateQueue from './updateQueue';
import { DataTypes } from './types';

import * as d3 from 'd3-array';

const DEFAULT_INDEX_OFFSET = 100;

export default class InMemoryView {

    constructor(table, {columns = [], sortCriteria = null, groupBy = null, filter=null}, updateQueue=new UpdateQueue()) {
        this._table = table;
        this._index_offset = DEFAULT_INDEX_OFFSET;
        this._filter = filter;
        this._groupState = null;
        this._sortCriteria = sortCriteria;
        // DO we need this line ?
        this._columns = columns.map(toColumn);
        this._columnMap = buildColumnMap(this._columns);
        this._groupby = groupBy;
        this._update_queue = updateQueue;
        // TODO we should pass columns into the rowset as it will be needed for computed columns
        this.rowSet = new RowSet(table, this._columns, this._index_offset);
        this.filterRowSet = null;

        // What if data is BOTH grouped and sorted ...
        if (groupBy !== null) {
            // more efficient to compute this directly from the table projection
            this.rowSet = new GroupRowSet(this.rowSet, this._columns, this._groupby, this._groupState);
        } else if (this._sortCriteria !== null) {
            this.rowSet.sort(this._sortCriteria);
        }

        this.rowUpdated = this.rowUpdated.bind(this);
        this.rowInserted = this.rowInserted.bind(this);

        table.on('rowUpdated', this.rowUpdated);
        table.on('rowInserted', this.rowInserted);

    }

    // this is ugly - need to think
    cloneChanges(){
        this._cloneChanges = true;
        return this;
    }

    destroy(){
        this._table.removeListener('rowUpdated', this.rowUpdated);
        this._table.removeListener('rowUpdated', this.rowInserted);
        this._table = null;
        this.rowSet = null;
        this.filterRowSet = null;
        this._update_queue = null;
    }

    get status() {
        return this._table.status;
    }

    get columns() {
        return this._columns;
    }

    get size() {
        return this.rowSet.size;
    }


    // rowInsertedDeprecated = (event, idx, row) => {
    //     const { rowSet, _update_queue } = this;
    //     const {range: _range} = rowSet;
    //     // const fullRange = getFullRange(_range); //TODO  after setRange operation, the range on row_data has changed from a fullRange
    //     // to a window-only range. 
    //     const newRow = this._tableHelper.projectColumns(this._columns, row, idx);
    //     const { insertedRow, updates, replace, append } = rowSet.insert(newRow);
    //     const { size, offset, data } = rowSet;
    //     const low = _range.lo + offset;
    //     const high = _range.hi + offset;

    //     if (insertedRow) { // non-grouping RowSet

    //         const index = insertedRow[System.INDEX_FIELD];
    //         //onsole.log(`row inserted @ [${index}] new length ${size} range: ${JSON.stringify(_range)} fullRange ${JSON.stringify(fullRange)}`);

    //         _update_queue.resize(size);

    //         // what if the index is before low - won't all index values have changed ? YES
    //         // not only that, but we must adjust our range
    //         if (index > rowSet.first[System.INDEX_FIELD] && index < rowSet.last[System.INDEX_FIELD]) {
    //             if (index < low) {
    //                 // should be ok to mutate. This change needs to be reported back to client
    //                 // Need a separate operation = reindex to capture this
    //                 _range.lo += 1;
    //                 _range.hi += 1;
    //             }
    //             _update_queue.replace(data.slice(_range.lo, _range.hi), size, offset);

    //         } else if (index >= low && index < high) {
    //             // we need to send updates for rows that are within buffered range not just window range
    //             _update_queue.append(insertedRow, offset);
    //         } else {
    //             console.log(`don't send inserted row to client as it is outside range`)
    //         }
    //     } else { // GroupRowSet

    //         if (replace) {
    //             _update_queue.replace(rowSet.setRange(_range, false), size, offset);
    //         } else {

    //             if (updates) {
    //                 updates.forEach(update => {
    //                     const [index] = update;
    //                     if (index >= low && index < high) {
    //                         _update_queue.update(update);
    //                     }
    //                 });
    //             }
    //             if (append) {
    //                 _update_queue.resize(size);
    //                 _update_queue.append(append, offset);
    //             }
    //         }
    //     }
    // }

    rowInserted(event, idx, row){
        const { _update_queue, rowSet } = this;
        const {size=null, replace, updates} = rowSet.insert(idx, row);
        if (size !== null){
            _update_queue.resize(size);
        }
        if (replace){
            const {rows,size,offset} = rowSet.currentRange()
            _update_queue.replace(rows, size, offset);
        } else if (updates){
            updates.forEach(update => {
                _update_queue.update(update);
            });

        }
        // what about offset change only ?
    }

    rowUpdated(event, idx, updates){
        const { rowSet, _update_queue } = this;
        // const {range, rowSet} = _row_data;
        const result = rowSet.update(idx, updates);
        if (result){
            if (rowSet instanceof RowSet) {
                // we wouldn't have got the update back if it wasn't in range
                if (withinRange(rowSet.range, result[0], rowSet.offset)) {
                    _update_queue.update(result);
                }
            } else {
                result.forEach(rowUpdate => {
                    //TODO pretty sure we've already checked the range within the rowset itself
                    if (withinRange(rowSet.range, rowUpdate[0], rowSet.offset)) {
                        _update_queue.update(rowUpdate);
                    }
                });
            }
        }
    }

    getData(dataType){
        return dataType === DataTypes.ROW_DATA
            ? this.rowSet
            : dataType === DataTypes.FILTER_DATA
                ? this.filterRowSet
                : null;
    }

    //TODO we seem to get a setRange when we reverse sort order, is that correct ?
    setRange(range, useDelta=true, dataType=DataTypes.ROW_DATA) {
        return this.getData(dataType).setRange(range, useDelta);
    }

    sort(sortCriteria) {
        this._sortCriteria = sortCriteria;
        this.rowSet.sort(sortCriteria);
        return this.setRange(resetRange(this.rowSet.range), false);
    }

    filter(filter) {
        const { rowSet, _filter, filterRowSet } = this;
        const {range} = rowSet;
        this._filter = filter;
        if (filter === null) {
            if (_filter) {
                rowSet.clearFilter();
            }
            // Note this is not strictly necessary. If filter in only on one column and filterRowSet is for same column, it can be kept
            this.filterRowSet = null;
        } else if (includesNoValues(filter)) {
            // this accommodates where user has chosen de-select all from filter set - 
            // TODO couldn't we handle that entirely on the client ?
            // if (filterRowSet) {
            //     filterRowSet.selectedIndices = [];
            // }
            return {
                range,
                rows: [],
                size: 0,
                offset: rowSet.offset
            };

        } else {
            this.rowSet.filter(filter);
        }

        if (filterRowSet) {
            filterRowSet.setSelected(filter);
        }

        return this.rowSet.setRange(resetRange(range), false);

    }

    groupBy(groupby) {
        const { rowSet, _columns, _groupState, _sortCriteria, _groupby } = this;
        const {range: _range} = rowSet;
        this._groupby = groupby;

        if (groupby === null){
            this.rowSet = RowSet.fromGroupRowSet(this.rowSet);
        } else {
            if (_groupby === null) {
                this.rowSet = new GroupRowSet(rowSet, _columns, groupby, _groupState, _sortCriteria);
            } else {
                rowSet.groupBy(groupby);
            }
        }
        return this.rowSet.setRange(_range, false);
    }

    setGroupState(groupState) {
        this._groupState = groupState;
        const {rowSet} = this;
        rowSet.setGroupState(groupState);
        // TODO should we have setRange return the following directly, so IMV doesn't have to decide how to call setRange ?
        // should we reset the range ?
        return rowSet.setRange(rowSet.range, false);
    }

    get updates() {
        const {_update_queue, rowSet: {range}} = this;
        let results={
            updates: _update_queue.popAll(),
            range: {
                lo: range.lo,
                hi: range.hi
            }
        };
        return results;
    }

    getFilterData(column, searchText=null, range=NULL_RANGE) {

        const { rowSet, filterRowSet, _filter: filter, _columnMap } = this;
        // If our own dataset has been filtered by the column we want values for, we cannot use it, we have
        // to go back to the source, using a filter which excludes the one in place on the target column. 
        const columnName = column.name;
        const colDef = this._columns.find(col => col.name === columnName);
        // No this should be decided beforehand (on client) 
        const type = getFilterType(colDef);
        const key = _columnMap[columnName];

        if (type === 'number'){
            // we need a notification from server to tell us when this is closed.
            // TODO support for groupRowset
            const {data, filteredData} = rowSet;
            const numbers = filteredData.map(rowIdx => data[rowIdx][key]);
            const values = d3.histogram().thresholds(20)(numbers).map((arr, i) => [i + 1, arr.length, arr.x0, arr.x1]);
            return {
                type: DataTypes.FILTER_BINS, values
            };
        
        } else if (!filterRowSet || filterRowSet.columnName !== column.name){
        
            this.filterRowSet = rowSet.getDistinctValuesForColumn(column);
        
        } else if (searchText){

            filterRowSet.searchText = searchText;
       
        } else if (filterRowSet && filterRowSet.searchText){
            // reset the filter
            filterRowSet.clearFilter();

        } else if (filter && filter.colName === column.name){
            // if we already have the data for this filter, nothing further to do except reset the filterdata range
            // so next request will return full dataset.
            filterRowSet.setRange({lo: 0,hi: 0});
        } 

        if (filter){
            this.filterRowSet.setSelected(filter);
        }

        // do we need to returtn searchText ?
        return this.filterRowSet.setRange(range, false);

    }

}
