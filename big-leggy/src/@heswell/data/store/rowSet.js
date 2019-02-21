import BaseRowSet from './baseRowSet';
import Table from './table';
import { sort, sortExtend, sortReversed, sortBy, sortPosition, sortableFilterSet } from './sort';
import {functor as filterPredicate, INCLUDE, EXCLUDE} from './filter';
import {extendsFilter, includesColumn as filterIncludesColumn, removeFilterForColumn, FILTER_DATA_COLUMNS, extractFilterForColumn} from './filterUtils';
import { addRowsToIndex } from './rowUtils';
import {groupbyExtendsExistingGroupby} from './groupUtils';
import { metaData, projectColumns, mapSortCriteria } from './columnUtils';

const numerically = (a,b) => a-b;
const removeUndefined = i => i !== undefined;

const SINGLE_COLUMN = 1;

const NO_OPTIONS = {
    filter: null
}
//TODO should range be baked into the concept of RowSet ?
export default class RowSet extends BaseRowSet {

    // TODO stream as above
    static fromGroupRowSet({table,columns,offset,currentFilter: filter}){
        return new RowSet(table,columns,offset,{
            filter
        });
    }
    //TODO consolidate API of rowSet, groupRowset
    constructor(table, columns, offset=0, {filter=null}=NO_OPTIONS) {
        super(columns, offset);
        this.table = table;
        this.project = projectColumns(table.columnMap, columns);
        this.meta = metaData(columns);
        this.data = table.rows;
        this.columnMap = table.columnMap;
        this.sortCols = null;
        this.filteredCount = null;
        this.sortReverse= false;
        this.buildSortSet();
        this.sortRequired = false;
        if (filter){
            this.currentFilter = filter;
            this.filter(filter);
        }
    }

    buildSortSet(){
        const len = this.data.length;
        const arr = Array(len);
        for (let i=0;i<len;i++){
            arr[i] = [i,null,null];
        }
        this.sortSet = arr;
    }

    slice(lo,hi){

        if (this.filterSet){
            const filteredData = this.filterSet.slice(lo, hi);
            const filterMapper = typeof filteredData[0] === 'number'
                ? idx => this.data[idx]
                : ([idx]) => this.data[idx];
            return filteredData
                .map(filterMapper)
                .map(this.project(lo+this.offset));
        } else if (this.sortCols){
            const sortSet = this.sortSet;
            const results = []
            for (let i=lo,rows=this.data,len=rows.length;i<len && i < hi;i++){
                const idx = this.sortReverse
                    ? sortSet[len - i - 1][0]
                    : sortSet[i][0];
                const row = rows[idx];
                results.push(row);
            }
            return results.map(this.project(lo+this.offset));
        } else {
            return this.data.slice(lo, hi).map(this.project(lo+this.offset));
        }
    }

    get size(){
        return this.filteredCount === null
            ? this.data.length
            : this.filteredCount
    }

    get first(){
        return this.data[0];
    }
    get last(){
        return this.data[this.data.length - 1];
    }
    get rawData(){
        return this.data;
    }
    get filteredData(){
        return this.data;
    }

    setStatus(status){
        this.status = status;
    }

    addRows(rows){
        addRowsToIndex(rows, this.index, this.meta.IDX);
        this.data = this.data.concat(rows);
    }

    sort(sortCols){

        const sortSet = this.currentFilter === null
            ? this.sortSet
            : this.filterSet = sortableFilterSet(this.filterSet);

        this.sortRequired = this.currentFilter !== null;

        if (sortReversed(this.sortCols, sortCols, SINGLE_COLUMN)){
            this.sortReverse = !this.sortReverse;
        } else if (this.sortCols !== null && groupbyExtendsExistingGroupby(sortCols, this.sortCols)){
            this.sortReverse = false;
            sortExtend(sortSet, this.data, this.sortCols, sortCols, this.columnMap)
        } else {
            this.sortReverse = false;
            sort(sortSet,this.data,sortCols,this.columnMap)
        }

        this.sortCols = sortCols;

    }

    clearFilter(){
        this.currentFilter = null;
        this.filterSet = null;
        this.filteredCount = null;
        if (this.sortRequired){
            this.sort(this.sortCols);
        }
    }

    filter(filter){
        const extendsCurrentFilter = extendsFilter(this.currentFilter, filter);
        const fn = filter && filterPredicate(this.columnMap, filter);
        const { data: rows } = this;
        let [navSet] = this.selectNavigationSet(extendsCurrentFilter && this.filterSet)
        const newFilterSet= [];

        for (let i=0;i<navSet.length;i++){
            const rowIdx = navSet === this.filterSet ? navSet[i] : navSet[i][0];
            const row = rows[rowIdx];
            if (fn(row)) {
                newFilterSet.push(rowIdx)
            }

        }
        this.filterSet = newFilterSet;
        this.currentFilter = filter;
        this.filteredCount = newFilterSet.length;

        if (!extendsCurrentFilter && this.sortRequired){
            // TODO this might be very expensive for large dataset
            this.sort(this.sortCols)
        }

    }
    //TODO where does this get called from ?
    update(idx, updates) {

        if (this.currentFilter === null && this.sortCols === null){
            if (idx >= this.range.lo && idx < this.range.hi){
                return [idx+this.offset,...updates];
            }
        } else if (this.currentFilter === null){
            const {sortSet} = this;
            for (let i=this.range.lo;i<this.range.hi;i++){
                const [rowIdx] = sortSet[i];
                if (rowIdx === idx){
                    return [i+this.offset, ...updates];
                }
            }
        } else {
            // sorted AND/OR filtered
            const {filterSet} = this;
            for (let i=this.range.lo;i<this.range.hi;i++){
                const rowIdx = Array.isArray(filterSet[i]) ? filterSet[i][0] : filterSet[i];
                if (rowIdx === idx){
                    return [i+this.offset, ...updates];
                }
            }
        }
    }

    getDistinctValuesForColumn(column){
        const {data: rows, currentFilter, columnMap} = this;
        const colIdx = columnMap[column.name]
        // TODO use filterSet
        const {FILTER_IND} = metaData(this.columns);
        const results = {};

        if (this.currentFilter === null){
            for (let i = 0, len = rows.length; i < len; i++) {
                const val = rows[i][colIdx]
                if (results[val]) {
                    results[val] += 1;
                } else {
                    results[val] = 1;
                }
            }
        } else if (filterIncludesColumn(currentFilter, column)){
            const reducedFilter = removeFilterForColumn(currentFilter, column);
            const fn = filterPredicate(columnMap, reducedFilter);

            for (let i = 0, len = rows.length; i < len; i++) {
                if (rows[i][FILTER_IND] === 1 || fn(rows[i])) {
                    const val = rows[i][colIdx]
                    if (results[val]) {
                        results[val] += 1;
                    } else {
                        results[val] = 1;
                    }
                }
            }

        } else {
            const {filterSet} = this;
            for (let i = 0, len = filterSet.length; i < len; i++) {
                const rowIdx = filterSet[i];
                const val = rows[rowIdx][colIdx]
                if (results[val]) {
                    results[val] += 1;
                } else {
                    results[val] = 1;
                }
            }
        }

        const keys = Object.keys(results).sort();
        const filterSet = Array(keys.length);
        for (let i=0,len=keys.length;i<len;i++){
            filterSet[i] = [keys[i],results[keys[i]]]
        }

        const table = new Table({data: filterSet, primaryKey: 'value', columns: FILTER_DATA_COLUMNS});
        const filterRowset = new FilterRowSet(table, FILTER_DATA_COLUMNS, column.name);

        return filterRowset;

    }

    insert(idx, row){
        // TODO multi colun sort sort DSC 
        if (this.sortCols === null && this.currentFilter === null){
            // simplest scenario, row will be at end of sortset ...
            this.sortSet.push([idx,null,null]);
            if (idx >= this.range.hi){
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
            // sort only
            const sortCols = mapSortCriteria(this.sortCols, this.columnMap);
            const [[colIdx]] = sortCols;
            const sortRow = [idx,row[colIdx]];
            const sorter = sortBy([[1,'asc']]);
            const sortPos = sortPosition(this.sortSet, sorter, sortRow, 'last-available');
            this.sortSet.splice(sortPos,0,sortRow);

            if (sortPos >= this.range.hi){
                return {
                    size: this.size
                }
            } else if (sortPos >= this.range.lo){
                return {
                    size: this.size,
                    replace: true
                }
            } else {
                return {
                    size: this.size,
                    offset: this.offset-1
                }
            }

        } else if (this.sortCols === null) {
            // filter only
            const fn = filterPredicate(this.columnMap, this.currentFilter);
            if (fn(row)){
                this.filteredCount += 1;
                const navIdx = this.filterSet.length;
                this.filterSet.push(idx);
                if (navIdx >= this.range.hi){
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
                        offset: this.offset-1
                    }
                }

            } else {
                return {}
            }
        } else {
            // sort AND filter
            const fn = filterPredicate(this.columnMap, this.currentFilter);
            if (fn(row)){
                this.filteredCount += 1;

                const sortCols = mapSortCriteria(this.sortCols, this.columnMap);
                const [[colIdx]] = sortCols; // TODO multi-colun sort
                const sortRow = [idx,row[colIdx]];
                const sorter = sortBy([[1,'asc']]); // TODO DSC
                const navIdx = sortPosition(this.filterSet, sorter, sortRow, 'last-available');
                this.filterSet.splice(navIdx,0,sortRow);
                    
                if (navIdx >= this.range.hi){
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
                        offset: this.offset-1
                    }
                }

            } else {
                return {}
            }

        }
    }
}

// This class must be declared here as there is a mutual dependency between
// this and RowSet and this extends RowSet
export class FilterRowSet extends RowSet {
    constructor(table, columns, columnName){
        super(table, columns);
        this.columnName = columnName;
        this._searchText = null;
    }
  
    get searchText(){
        return this._searchText;
    }
  
    set searchText(text){
        this.filter({type: 'SW',colName: 'value', value: text});
        this._searchText = text;
    }
  
    get values() {
        const KEY = 3;
        return this.filterSet.map(idx => this.data[idx][KEY])
    }
  
    setSelectedIndices(filter){
        const columnFilter = extractFilterForColumn(filter, this.columnName);
        const filterType = columnFilter && columnFilter.type;
        if (filterType === INCLUDE || filterType === EXCLUDE){ // what about numeric GE etc
            const selectedIndices = this.indexOfKeys(columnFilter.values);
            this.selectedIndices = this.filterSet === null
                ? selectedIndices
                : selectedIndices.map(idx => this.filterSet.indexOf(idx)).filter(idx => ~idx);
  
        }
    }
  
    indexOfKeys(values){
        const index = this.table.index;
        return values.map(value => index[value]).filter(removeUndefined).sort(numerically);
    }
  
  }
  