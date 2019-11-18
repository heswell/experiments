import { resetRange, withinRange } from './rangeUtils';
import { RowSet, GroupRowSet } from './rowset/index';
import { buildColumnMap, toColumn, getFilterType } from './columnUtils';
import UpdateQueue from './update-queue';
import { DataTypes } from './types';
import { addFilter, IN, NOT_IN } from './filter';

const DEFAULT_INDEX_OFFSET = 100;
export default class DataView {

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
        // Is one filterRowset enough, or should we manage one for each column ?
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
        this._table.removeListener('rowInserted', this.rowInserted);
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
        const result = rowSet.update(idx, updates);

        if (result) {
            if (rowSet instanceof RowSet) {
                _update_queue.update(result);
            } else {
                result.forEach(rowUpdate => {
                    _update_queue.update(rowUpdate);
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

    select(idx, rangeSelect, keepExistingSelection, dataType=DataTypes.ROW_DATA){
        const rowset = this.getData(dataType);
        const updates = rowset.select(idx, rangeSelect, keepExistingSelection);
        if (dataType === DataTypes.ROW_DATA){
            return this.selectResponse(updates, dataType, rowset);
        } else {
            // we need to handle this case here, as the filter we construct depends on the selecion details
            // TODO we shouldn't be using the sortSet here, need an API method
            const [, value] = rowset.sortSet[idx];
            const isSelected = rowset.selected.rows.includes(idx);
            const filter = {
                type: isSelected ? IN : NOT_IN,
                colName: rowset.columnName,
                values: [value]
            }
            this.applyFilterSetChangeToFilter(filter);

            if (updates.length > 0){
                return {filterData: {
                    updates,
                    dataCounts: {
                        filterRowTotal: rowset.size,
                        filterRowSelected: rowset.selected.rows.length
                    }
                }}
            }
        }
    }

    selectAll(dataType=DataTypes.ROW_DATA){
        const rowset = this.getData(dataType);
        return this.selectResponse(rowset.selectAll(), dataType, rowset);
    }

    selectNone(dataType=DataTypes.ROW_DATA){
        const rowset = this.getData(dataType);
        return this.selectResponse(rowset.selectNone(), dataType, rowset);
    }

    selectResponse(updates, dataType, rowset){
        const updatesInViewport = updates.length > 0;
        if (dataType === DataTypes.ROW_DATA){
            if (updatesInViewport){
                return {updates};
            }
        } else {
            const filterRowTotal = rowset.size;
            const filterRowSelected = rowset.selected.rows.length

            // Maybe defer the filter operation ?
            if (filterRowSelected === 0){
                this.applyFilterSetChangeToFilter({colName: rowset.columnName, type: IN, values: []});
            } else if (filterRowSelected === filterRowTotal){
                this.applyFilterSetChangeToFilter({colName: rowset.columnName, type: NOT_IN, values: []});
            } else {

            }

            if (updatesInViewport){
                return {filterData: {
                    updates,
                    dataCounts: {
                        filterRowTotal,
                        filterRowSelected
                    }
                }}
            }
        }
    }
    
    sort(sortCriteria) {
        this._sortCriteria = sortCriteria;
        this.rowSet.sort(sortCriteria);
        // assuming the only time we would not useDelta is when we want to reset ?
        return this.setRange(resetRange(this.rowSet.range), false);
    }

    filter(filter, dataType=DataTypes.ROW_DATA, incremental=false) {
        if (dataType === DataTypes.FILTER_DATA){

            return [undefined,this.filterFilterData(filter)];
        
        } else {
            if (incremental){
                filter = addFilter(this._filter, filter);
            }
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
                    // TODO examine this. Must be a more efficient way to reset counts in filterRowSet
                    const {columnName, range} = filterRowSet;
                    this.filterRowSet = rowSet.getDistinctValuesForColumn({name:columnName});
                    filterResultset = this.filterRowSet.setRange(range, false);
                }
            }
    
            const resultSet = {
                ...(this.rowSet.setRange(resetRange(range), false)),
                filter
            }
    
            return filterResultset
                ? [resultSet, filterResultset]
                : [resultSet];
        }

    }

    applyFilterSetChangeToFilter(partialFilter){
        const [{filter, rows, offset, range, size}] = this.filter(partialFilter, DataTypes.ROW_DATA, true);
        console.log(`filter applied size=${size}`, rows);
        this._update_queue.replace(rows, size, range, offset);
    }

    applyFilter(){

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

    getFilterData(column, searchText = null, range) {
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
            // range = range || filterRowSet.range;
            filterRowSet.searchText = searchText;

        } else if (filterRowSet && filterRowSet.searchText) {
            // range = range || filterRowSet.range;
            filterRowSet.clearFilter();
            
        } else if (filterRowSet && filterRowSet.columnName === column.name) {
            // if we already have the data for this filter, nothing further to do except reset the filterdata range
            // so next request will return full dataset.
            filterRowSet.setRange({ lo: 0, hi: 0 });
        }
        // If we already have a filterRowset for this column, but a filter on another column has changed, we need to
        // recreate the filterRowset: SHould this happen when filter happens ?

        if (filter) {
            this.filterRowSet.setSelected(filter, this.rowSet.filterCount);
        } else {
            this.filterRowSet.selectAll();
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
