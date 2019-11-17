/**
 * Keep all except for groupRowset in this file to avoid circular reference warnings
 */
import * as d3 from 'd3-array';
import Table from '../table';
import SelectionModel, {SelectionModelType} from '../selection-model';
import { sort, sortExtend, sortReversed, sortBy, sortPosition, sortableFilterSet } from '../sort';
import { 
    BIN_FILTER_DATA_COLUMNS,
    SET_FILTER_DATA_COLUMNS,
    extendsFilter,
    extractFilterForColumn,
    functor as filterPredicate,
    splitFilterOnColumn,
    overrideColName
} from '../filter';
import { addRowsToIndex, arrayOfIndices } from '../rowUtils';
import { groupbyExtendsExistingGroupby } from '../groupUtils';
import { projectColumns, projectColumnsFilter, mapSortCriteria, metaData } from '../columnUtils';
import { DataTypes } from '../types';
import { getDeltaRange, getFullRange, NULL_RANGE } from '../rangeUtils';

const SINGLE_COLUMN = 1;

const NO_OPTIONS = {
    filter: null
}

export default class BaseRowSet {

    constructor(table, columns, offset = 0) {
        this.table = table;
        this.offset = offset;
        this.baseOffset = offset;
        this.range = NULL_RANGE;
        this.columns = columns;
        this.currentFilter = null;
        this.filterSet = null;
        this.columnMap = table.columnMap;
        this.meta = metaData(columns);
        this.data = table.rows;
        this.selected = {rows: [], focusedIdx: -1, lastTouchIdx: -1};
        this.selectionModel = this.createSelectionModel();
    }

    createSelectionModel(){
        return new SelectionModel();
    }

    // used by binned rowset
    get filteredData() {
        if (this.filterSet) {
            return this.filterSet;
        } else {
            const { IDX } = this.meta;
            return this.data.map(row => row[IDX])
        }
    }

    get filterCount(){
        return this.filterSet
            ? this.filterSet.length
            : this.data.length;
    }

    setRange(range=this.range, useDelta = true) {

        const { lo, hi } = useDelta ? getDeltaRange(this.range, range) : getFullRange(range);
        const resultset = this.slice(lo, hi);
        this.range = range;
        return {
            rows: resultset,
            range,
            size: this.size,
            offset: this.offset
        };
    }

    currentRange() {
        const { lo, hi } = this.range;
        const resultset = this.slice(lo, hi);
        return {
            rows: resultset,
            range: this.range,
            size: this.size,
            offset: this.offset
        };
    }

    select(idx, rangeSelect, keepExistingSelection){

        const {meta: {SELECTED}, selectionModel, range: {lo, hi}, offset} = this;
        
        const {selected, deselected, ...selectionState} = selectionModel.select(
            this.selected,
            idx,
            rangeSelect,
            keepExistingSelection
        );
        
        this.selected = selectionState;

        const updates = [];
        for (let i=0;i<selected.length;i++){
            const idx = selected[i];
            if (idx >= lo && idx < hi){
                updates.push([idx+offset,SELECTED, 1]);
            }
        }
        for (let i=0;i<deselected.length;i++){
            const idx = deselected[i];
            if (idx >= lo && idx < hi){
                updates.push([idx+offset,SELECTED, 0]);
            }
        }
        
        return updates;
    }

    selectAll(){
        const {data, meta: {SELECTED}, range: {lo, hi}, offset} = this;
        const previouslySelectedRows = this.selected.rows;
        
        // Step 1: brute force approach, actually create list of selected indices
        this.selected = {rows: arrayOfIndices(data.length), focusedIdx: -1, lastTouchIdx: -1};

        const updates = [];
        for (let i=lo;i<hi;i++){
            if (!previouslySelectedRows.includes(i)){
                updates.push([i+offset,SELECTED, 1]);
            }
        }
        
        return updates;

    }

    selectNone(){

        const {meta: {SELECTED}, range: {lo, hi}, offset} = this;
        const previouslySelectedRows = this.selected.rows;
        this.selected = {rows: [], focusedIdx: -1, lastTouchIdx: -1};


        //TODO this isn't right. We don't store the selection state on internal rows,
        // we populate it during projection, so SELECTION will never be 1.
        // do we preserve the previous 'selected' to chack against ?
        const updates = [];
        for (let i=lo;i<hi;i++){
            if (previouslySelectedRows.includes(i)){
                updates.push([i+offset,SELECTED, 0]);
            }
        }
        return updates;
    }

    selectNavigationSet(useFilter) {
        const { COUNT, IDX_POINTER, FILTER_COUNT, NEXT_FILTER_IDX } = this.meta;
        return useFilter
            ? [this.filterSet, NEXT_FILTER_IDX, FILTER_COUNT]
            : [this.sortSet, IDX_POINTER, COUNT];
    }

    //TODO cnahge to return a rowSet, same as getDistinctValuesForColumn
    getBinnedValuesForColumn(column) {
        const key = this.columnMap[column.name];
        const { data: rows, filteredData } = this;
        const numbers = filteredData.map(rowIdx => rows[rowIdx][key]);
        const data = d3.histogram().thresholds(20)(numbers).map((arr, i) => [i + 1, arr.length, arr.x0, arr.x1]);

        const table = new Table({ data, primaryKey: 'bin', columns: BIN_FILTER_DATA_COLUMNS });
        const filterRowset = new BinFilterRowSet(table, BIN_FILTER_DATA_COLUMNS, column.name);
        return filterRowset;
    }

    getDistinctValuesForColumn(column) {
        const { data: rows, columnMap, currentFilter } = this;
        const colIdx = columnMap[column.name]
        const resultMap = {};
        const data = [];
        const dataRowCount = rows.length;
        const [/*columnFilter*/, otherFilters] = splitFilterOnColumn(currentFilter, column)
        // this filter for column that we remove will provide our selected values   
        let dataRowAllFilters = 0;

        if (otherFilters === null) {
            let result;
            for (let i = 0; i < dataRowCount; i++) {
                const val = rows[i][colIdx];
                if (result = resultMap[val]) {
                    result[2] = ++result[1];
                } else {
                    result = [val, 1, 1]
                    resultMap[val] = result;
                    data.push(result)
                }
            }
            dataRowAllFilters = dataRowCount;
        } else {

            const fn = filterPredicate(columnMap, otherFilters);
            let result;

            for (let i = 0; i < dataRowCount; i++) {
                const row = rows[i];
                const val = row[colIdx];
                const isIncluded = fn(row) ? 1 : 0;
                if (result = resultMap[val]) {
                    result[1] += isIncluded;
                    result[2]++;
                } else {
                    result = [val, isIncluded, 1]
                    resultMap[val] = result;
                    data.push(result)
                }
                dataRowAllFilters += isIncluded;
            }
        }

        //TODO primary key should be indicated in columns
        const table = new Table({ data, primaryKey: 'name', columns: SET_FILTER_DATA_COLUMNS });
        return new SetFilterRowSet(table, SET_FILTER_DATA_COLUMNS, column.name, dataRowAllFilters, dataRowCount);

    }
}

//TODO should range be baked into the concept of RowSet ?
export class RowSet extends BaseRowSet {

    // TODO stream as above
    static fromGroupRowSet({ table, columns, offset, currentFilter: filter }) {
        return new RowSet(table, columns, offset, {
            filter
        });
    }
    //TODO consolidate API of rowSet, groupRowset
    constructor(table, columns, offset = 0, { filter = null } = NO_OPTIONS) {
        super(table, columns, offset);
        this.project = projectColumns(table.columnMap, columns, this.meta);
        this.sortCols = null;
        this.sortReverse = false;
        this.sortSet = this.buildSortSet();
        this.filterSet = null;
        this.sortRequired = false;
        if (filter) {
            this.currentFilter = filter;
            this.filter(filter);
        }

    }

    buildSortSet() {
        const len = this.data.length;
        const arr = Array(len);
        for (let i = 0; i < len; i++) {
            arr[i] = [i, null, null];
        }
        return arr;
    }

    slice(lo, hi) {
        const {data, selected, filterSet, offset, sortCols, sortSet, sortReverse} = this;
        if (filterSet) {
            const filteredData = filterSet.slice(lo, hi);
            const filterMapper = typeof filteredData[0] === 'number'
                ? idx => data[idx]
                : ([idx]) => data[idx];
            return filteredData
                .map(filterMapper)
                .map(this.project(lo, offset, selected.rows));
        } else if (sortCols) {
            const results = []
            for (let i = lo, len = data.length; i < len && i < hi; i++) {
                const idx = sortReverse
                    ? sortSet[len - i - 1][0]
                    : sortSet[i][0];
                const row = data[idx];
                results.push(row);
            }
            return results.map(this.project(lo, offset, selected.rows));
        } else {
            return this.data.slice(lo, hi).map(this.project(lo, offset, selected.rows));
        }
    }

    // deprecated
    get size() {
        return this.filterSet === null
            ? this.data.length
            : this.filterSet.length
    }

    get first() {
        return this.data[0];
    }
    get last() {
        return this.data[this.data.length - 1];
    }
    get rawData() {
        return this.data;
    }

    setStatus(status) {
        this.status = status;
    }

    addRows(rows) {
        addRowsToIndex(rows, this.index, this.meta.IDX);
        this.data = this.data.concat(rows);
    }

    sort(sortCols) {

        const sortSet = this.currentFilter === null
            ? this.sortSet
            : this.filterSet = sortableFilterSet(this.filterSet);

        this.sortRequired = this.currentFilter !== null;

        if (sortReversed(this.sortCols, sortCols, SINGLE_COLUMN)) {
            this.sortReverse = !this.sortReverse;
        } else if (this.sortCols !== null && groupbyExtendsExistingGroupby(sortCols, this.sortCols)) {
            this.sortReverse = false;
            sortExtend(sortSet, this.data, this.sortCols, sortCols, this.columnMap)
        } else {
            this.sortReverse = false;
            sort(sortSet, this.data, sortCols, this.columnMap)
        }

        this.sortCols = sortCols;

    }

    clearFilter() {
        this.currentFilter = null;
        this.filterSet = null;
        if (this.sortRequired) {
            this.sort(this.sortCols);
        }
    }

    filter(filter) {
        const extendsCurrentFilter = extendsFilter(this.currentFilter, filter);
        const fn = filter && filterPredicate(this.columnMap, filter);
        const { data: rows } = this;
        let [navSet] = this.selectNavigationSet(extendsCurrentFilter && this.filterSet)
        const newFilterSet = [];

        for (let i = 0; i < navSet.length; i++) {
            const rowIdx = navSet === this.filterSet ? navSet[i] : navSet[i][0];
            const row = rows[rowIdx];
            if (fn(row)) {
                newFilterSet.push(rowIdx)
            }

        }
        this.filterSet = newFilterSet;
        this.currentFilter = filter;
        if (!extendsCurrentFilter && this.sortRequired) {
            // TODO this might be very expensive for large dataset
            // WHEN DO WE DO THIS - IS THIS CORRECT !!!!!
            this.sort(this.sortCols)
        }
        return newFilterSet.length;

    }

    update(idx, updates) {
        if (this.currentFilter === null && this.sortCols === null) {
            if (idx >= this.range.lo && idx < this.range.hi) {
                return [idx + this.offset, ...updates];
            }
        } else if (this.currentFilter === null) {
            const { sortSet } = this;
            for (let i = this.range.lo; i < this.range.hi; i++) {
                const [rowIdx] = sortSet[i];
                if (rowIdx === idx) {
                    return [i + this.offset, ...updates];
                }
            }
        } else {
            // sorted AND/OR filtered
            const { filterSet } = this;
            for (let i = this.range.lo; i < this.range.hi; i++) {
                const rowIdx = Array.isArray(filterSet[i]) ? filterSet[i][0] : filterSet[i];
                if (rowIdx === idx) {
                    return [i + this.offset, ...updates];
                }
            }
        }
    }

    insert(idx, row) {
        // TODO multi colun sort sort DSC 
        if (this.sortCols === null && this.currentFilter === null) {
            // simplest scenario, row will be at end of sortset ...
            this.sortSet.push([idx, null, null]);
            if (idx >= this.range.hi) {
                // ... row is beyond viewport
                return {
                    size: this.size
                }
            } else {
                // ... row is within viewport
                return {
                    size: this.size,
                    replace: true
                }
            }
        } else if (this.currentFilter === null) {
            // sort only - currently only support single column sorting
            const sortCols = mapSortCriteria(this.sortCols, this.columnMap);
            const [[colIdx]] = sortCols;
            const sortRow = [idx, row[colIdx]];
            const sorter = sortBy([[1, 'asc']]); // the sortSet is always ascending
            const sortPos = sortPosition(this.sortSet, sorter, sortRow, 'last-available');
            this.sortSet.splice(sortPos, 0, sortRow);

            // we need to know whether it is an ASC or DSC sort to determine whether row is in viewport
            const viewportPos = this.sortReverse
                ? this.size - sortPos
                : sortPos;

            if (viewportPos >= this.range.hi) {
                return {
                    size: this.size
                }
            } else if (viewportPos >= this.range.lo) {
                return {
                    size: this.size,
                    replace: true
                }
            } else {
                return {
                    size: this.size,
                    offset: this.offset - 1
                }
            }

        } else if (this.sortCols === null) {
            // filter only
            const fn = filterPredicate(this.columnMap, this.currentFilter);
            if (fn(row)) {
                const navIdx = this.filterSet.length;
                this.filterSet.push(idx);
                if (navIdx >= this.range.hi) {
                    // ... row is beyond viewport
                    return {
                        size: this.size
                    }
                } else if (navIdx >= this.range.lo) {
                    // ... row is within viewport
                    return {
                        size: this.size,
                        replace: true
                    }
                } else {
                    return {
                        size: this.size,
                        offset: this.offset - 1
                    }
                }

            } else {
                return {}
            }
        } else {
            // sort AND filter
            const fn = filterPredicate(this.columnMap, this.currentFilter);
            if (fn(row)) {
                // TODO what about totalCOunt

                const sortCols = mapSortCriteria(this.sortCols, this.columnMap);
                const [[colIdx, direction]] = sortCols; // TODO multi-colun sort
                const sortRow = [idx, row[colIdx]];
                const sorter = sortBy([[1, direction]]); // TODO DSC
                const navIdx = sortPosition(this.filterSet, sorter, sortRow, 'last-available');
                this.filterSet.splice(navIdx, 0, sortRow);

                if (navIdx >= this.range.hi) {
                    // ... row is beyond viewport
                    return {
                        size: this.size
                    }
                } else if (navIdx >= this.range.lo) {
                    // ... row is within viewport
                    return {
                        size: this.size,
                        replace: true
                    }
                } else {
                    return {
                        size: this.size,
                        offset: this.offset - 1
                    }
                }

            } else {
                return {}
            }

        }
    }
}

// TODO need to retain and return any searchText
export class SetFilterRowSet extends RowSet {
    constructor(table, columns, columnName, dataRowAllFilters, dataRowTotal) {
        super(table, columns);        
        this.columnName = columnName;
        this._searchText = null;
        this.dataRowFilter = null;
        this.dataCounts = {
            dataRowTotal,
            dataRowAllFilters,
            dataRowCurrentFilter : 0,
            filterRowTotal : this.data.length,
            filterRowSelected : this.data.length,
            filterRowHidden : 0
        };
        this.sort([['name', 'asc']]);
    }

    createSelectionModel(){
        return new SelectionModel(SelectionModelType.Checkbox);
    }


    get searchText() {
        return this._searchText;
    }

    set searchText(text) {
        this.selectedCount = this.filter({ type: 'SW', colName: 'name', value: text });
        this._searchText = text;
        // reset range so next request will be met from top
        this.clearRange();
    }


    currentRange(){
        //TODO move these into a single struct

            return {
                ...super.currentRange(),
                //TODO is this necessary, these won't change on a range request
                dataCounts: this.dataCounts
            }
    
    }

    clearRange(){
        this.range = {lo:0, hi: 0};
    }
    
    setRange(range, useDelta){

        return {
            ...super.setRange(range, useDelta),
            //TODO is this necessary, these won't change on a range request
            dataCounts: this.dataCounts
        }
    }

    filter(filter){
        super.filter(filter);

        const {dataCounts, filterSet, data: rows, dataRowFilter, table, columnName} = this;
        let columnFilter;

        if (dataRowFilter && (columnFilter = extractFilterForColumn(dataRowFilter, columnName))){
            const columnMap = table.columnMap;
            const fn = filterPredicate(columnMap, overrideColName(columnFilter, 'name'), true);
            dataCounts.filterRowSelected = filterSet.reduce((count, i) => count + (fn(rows[i]) ? 1 : 0),0) 
                
        } else {
            dataCounts.filterRowSelected = filterSet.length;
        }

        return dataCounts.filterRowTotal = filterSet.length;
    }

    clearFilter() {
        this.currentFilter = null;
        this.filterSet = null;
        this._searchText = '';
        this.clearRange();
    }


    get values() {
        const key = this.columnMap['name'];
        return this.filterSet.map(idx => this.data[idx][key])
    }

    setSelected(dataRowFilter, dataRowAllFilters) {

        const columnFilter = extractFilterForColumn(dataRowFilter, this.columnName);
        const columnMap = this.table.columnMap;
        const {dataCounts, data: rows, filterSet} = this;

        this.dataRowFilter = dataRowFilter;
        
        if (columnFilter){

            const fn = filterPredicate(columnMap, overrideColName(columnFilter, 'name'), true);
            const selectedRows = [];

            dataCounts.filterRowSelected = filterSet
                ? filterSet.reduce((count, i) => {
                    if (fn(rows[i])){
                        selectedRows.push(i);
                        return count + 1;
                    } else {
                        return count;
                    }
                },0) 
                : rows.reduce((count, row, i) => {
                    if (fn(row)){
                        selectedRows.push(i);
                       return count + 1;     
                    } else {
                        return count;
                    }
                },0) 
            
            this.selected = {rows: selectedRows, focusedIdx: -1, lastTouchIdx: -1 }
        
        } else {

            dataCounts.filterRowSelected = filterSet
                ? filterSet.length
                : rows.length;

            this.selectAll();    
        }

        dataCounts.dataRowAllFilters = dataRowAllFilters;


        return this.currentRange();

    }
}

export class BinFilterRowSet extends RowSet {
    constructor(table, columns, columnName) {
        super(table, columns);
        this.type = DataTypes.FILTER_BINS;
        this.columnName = columnName;
    }

    setSelected(filter){
        console.log(`need to apply filter to selected BinRowset`, filter)
    }
    // we don't currently have a concept of range here, but it will
    // be used in the future
    // Note: currently no projection here, we don't currently need metadata
    setRange() {
        return {
            type: this.type,
            rows: this.data,
            range: null,
            size: this.size,
            offset: 0
        };
    }

}
