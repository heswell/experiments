import { NULL_RANGE, resetRange, withinRange } from './rangeUtils';
import { RowSet, GroupRowSet } from './rowset';
import { buildColumnMap, toColumn, getFilterType } from './columnUtils';
import UpdateQueue from './updateQueue';
import { DataTypes } from './types';

const DEFAULT_INDEX_OFFSET = 100;

export default class InMemoryView {

    constructor(table, { columns = [], sortCriteria = null, groupBy = null, filter = null }, updateQueue = new UpdateQueue()) {
        this._table = table;
        this._index_offset = DEFAULT_INDEX_OFFSET;
        this._filter = filter;
        this._groupState = null;
        this._sortCriteria = sortCriteria;

        this._columns = null;
        this._columnMap = null;
        // column defs come from client, this is where we assign column keys
        this.columns = columns;

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

    // Set the columns from client
    set columns(columns) {
        this._columns = columns.map(toColumn);
        this._columnMap = buildColumnMap(this._columns);
    }

    destroy() {
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

    rowInserted(event, idx, row) {
        const { _update_queue, rowSet } = this;
        const { size = null, replace, updates } = rowSet.insert(idx, row);
        if (size !== null) {
            _update_queue.resize(size);
        }
        if (replace) {
            const { rows, size, offset } = rowSet.currentRange()
            _update_queue.replace(rows, size, offset);
        } else if (updates) {
            updates.forEach(update => {
                _update_queue.update(update);
            });

        }
        // what about offset change only ?
    }

    rowUpdated(event, idx, updates) {
        const { rowSet, _update_queue } = this;
        // const {range, rowSet} = _row_data;
        const result = rowSet.update(idx, updates);
        if (result) {
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

    getData(dataType) {
        return dataType === DataTypes.ROW_DATA
            ? this.rowSet
            : dataType === DataTypes.FILTER_DATA
                ? this.filterRowSet
                : null;
    }

    //TODO we seem to get a setRange when we reverse sort order, is that correct ?
    setRange(range, useDelta = true, dataType = DataTypes.ROW_DATA) {
        return this.getData(dataType).setRange(range, useDelta);
    }

    sort(sortCriteria) {
        this._sortCriteria = sortCriteria;
        this.rowSet.sort(sortCriteria);
        return this.setRange(resetRange(this.rowSet.range), false);
    }

    filter(filter, dataType=DataTypes.ROW_DATA) {
        if (dataType === DataTypes.FILTER_DATA){

            return [undefined,this.filterFilterData(filter)];
        
        } else {
            const { rowSet, _filter, filterRowSet } = this;
            const { range } = rowSet;
            this._filter = filter;
            let filterResultset;
            let filterCount = rowSet.totalCount;
    
            if (filter === null && _filter) {
                rowSet.clearFilter();
            } else if (filter){
                filterCount = this.rowSet.filter(filter);
            } else {
                throw Error(`InMemoryView.filter setting null filter when we had no filter anyway`);
            }
    
            if (filterRowSet) {
                if (filter){
                    filterResultset = filterRowSet.setSelected(filter, filterCount);
                } else {
                    // TODO examine this. Must be a more efficient way to reset counts in filterSet
                    const {columnName, range} = filterRowSet;
                    this.filterRowSet = rowSet.getDistinctValuesForColumn({name:columnName});
                    filterResultset = this.filterRowSet.setRange(range, false)
                }
            }
    
            const resultSet = this.rowSet.setRange(resetRange(range), false);
    
            return filterResultset
                ? [resultSet, filterResultset]
                : [resultSet];
        }

    }

    groupBy(groupby) {
        const { rowSet, _columns, _groupState, _sortCriteria, _groupby } = this;
        const { range: _range } = rowSet;
        this._groupby = groupby;

        if (groupby === null) {
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
        const { rowSet } = this;
        rowSet.setGroupState(groupState);
        // TODO should we have setRange return the following directly, so IMV doesn't have to decide how to call setRange ?
        // should we reset the range ?
        return rowSet.setRange(rowSet.range, false);
    }

    get updates() {
        const { _update_queue, rowSet: { range } } = this;
        let results = {
            updates: _update_queue.popAll(),
            range: {
                lo: range.lo,
                hi: range.hi
            }
        };
        return results;
    }

    getFilterData(column, searchText = null, range = NULL_RANGE) {

        const { rowSet, filterRowSet, _filter: filter, _columnMap } = this;
        // If our own dataset has been filtered by the column we want values for, we cannot use it, we have
        // to go back to the source, using a filter which excludes the one in place on the target column. 
        const columnName = column.name;
        const colDef = this._columns.find(col => col.name === columnName);
        // No this should be decided beforehand (on client) 
        const type = getFilterType(colDef);

        if (type === 'number') {
            // // we need a notification from server to tell us when this is closed.
            // we should assign to filterRowset
            this.filterRowSet = rowSet.getBinnedValuesForColumn(column);

        } else if (!filterRowSet || filterRowSet.columnName !== column.name) {

            this.filterRowSet = rowSet.getDistinctValuesForColumn(column);

        } else if (searchText) {

            filterRowSet.searchText = searchText;

        } else if (filterRowSet && filterRowSet.searchText) {
            // reset the filter
            filterRowSet.clearFilter();

        } else if (filter && filter.colName === column.name) {
            // if we already have the data for this filter, nothing further to do except reset the filterdata range
            // so next request will return full dataset.
            filterRowSet.setRange({ lo: 0, hi: 0 });
        }

        if (filter) {
            this.filterRowSet.setSelected(filter, this.rowSet.filterCount);
        }

        // do we need to returtn searchText ? If so, it should
        // be returned by the rowSet
        return this.filterRowSet.setRange(range, false);

    }

    filterFilterData(filter){
        const {filterRowSet} = this;
        if (filterRowSet){

            if (filter === null) {
                filterRowSet.clearFilter();
            } else if (filter){
                filterRowSet.filter(filter);
            }
            return filterRowSet.setRange(resetRange(filterRowSet.range), false);
    
        } else {
            console.error(`[InMemoryView] filterfilterRowSet no filterRowSet`)
        }

    }

}
