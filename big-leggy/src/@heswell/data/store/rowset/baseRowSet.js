import Table from '../table';
import {includesColumn as filterIncludesColumn, removeFilterForColumn, FILTER_DATA_COLUMNS} from '../filterUtils';
import {FilterRowSet} from './filter-rowset'
import {functor as filterPredicate} from '../filter';

import {getDeltaRange, getFullRange, NULL_RANGE} from '../rangeUtils';
import { metaData } from '../columnUtils';

export default class BaseRowSet {

    constructor(table, columns, offset=0){
        this.offset = offset;
        this.baseOffset = offset;
        this.range = NULL_RANGE;
        this.columns = columns;
        this.currentFilter = null;
        this.filterSet = null;
        this.table = table;
        this.data = table.rows;
        this.meta = metaData(columns);

    }

    get filteredData(){
        if (this.filterSet){
            return this.filterSet;
        } else {
            const {IDX} = this.meta;
            return this.data.map(row => row[IDX])
        }
    }

    setRange(range, useDelta=true){

        const { lo, hi } = useDelta ? getDeltaRange(this.range, range) : getFullRange(range);
        const resultset = this.slice(lo,hi);
        this.range = range;
        return {
            rows: resultset,
            range,
            size: this.size,
            offset: this.offset
        };
    }

    currentRange(){
        const { lo, hi } = this.range;
        const resultset = this.slice(lo, hi);
        return {
            rows: resultset,
            range: this.range,
            size: this.size,
            offset: this.offset
        };
    }

    selectNavigationSet(useFilter){
        const { COUNT, IDX_POINTER, FILTER_COUNT, NEXT_FILTER_IDX } = this.meta;
        return useFilter
            ? [this.filterSet, NEXT_FILTER_IDX, FILTER_COUNT]
            : [this.sortSet, IDX_POINTER, COUNT];
    }
    
    //TODO will need to make this more performant. We shouldn't need to actually test every row against the 
    // filter - we've already done that to filter the rows
    getDistinctValuesForColumn(column){

        const {data: rows, columnMap, currentFilter} = this;
        const colIdx = columnMap[column.name]
        const resultMap = {};
        const data = [];
        const filter = currentFilter === null
            ? null
            : filterIncludesColumn(currentFilter, column)
                ? removeFilterForColumn(currentFilter, column)
                : currentFilter;

        if (filter === null){
            let result;
            for (let i = 0, len = rows.length; i < len; i++) {
                const val = rows[i][colIdx];
                if (result = resultMap[val]) {
                    result[2] = ++result[1];
                } else {
                    result = [val, 1, 1]
                    resultMap[val] = result;
                    data.push(result)
                }
            }
        } else {

            const fn = filterPredicate(columnMap, filter);
            let result;

            for (let i = 0, len = rows.length; i < len; i++) {
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
            }
        }

        const table = new Table({data, primaryKey: 'value', columns: FILTER_DATA_COLUMNS});
        const filterRowset = new FilterRowSet(table, FILTER_DATA_COLUMNS, column.name);

        return filterRowset;

    }
    
}
