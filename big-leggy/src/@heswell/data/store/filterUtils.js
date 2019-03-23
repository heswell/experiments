import * as d3 from 'd3-array';
// import { stringCollector } from './dataCollector';
import {SET, EXCLUDE, STARTS_WITH, AND, INCLUDE} from './filter';
import {metaData} from './columnUtils';

export const SET_FILTER_DATA_COLUMNS = [
    {name: 'value'}, 
    {name: 'count'}, 
    {name: 'totalCount'}
];

export const BIN_FILTER_DATA_COLUMNS = [
    {name: 'bin'}, 
    {name: 'count'}, 
    {name: 'bin-lo'},
    {name: 'bin-hi'}
];

export const setFilterColumnMeta = metaData(SET_FILTER_DATA_COLUMNS)
export const binFilterColumnMeta = metaData(BIN_FILTER_DATA_COLUMNS)

export function getFilterColumn(column) {
    return column.isGroup ? column.columns[0] : column;
}

export function shouldShowFilter(filterColumnName, column) {
    const filterColumn = getFilterColumn(column);
    if (filterColumn.isGroup) {
        return filterColumn.columns.some(col => col.name === filterColumnName);
    } else {
        return filterColumnName === filterColumn.name;
    }
}

export function includesNoValues(filter) {
    // TODO make sure we catch all cases...
    if (!filter){
        return false;
    } else if (filter.type === SET && filter.mode !== EXCLUDE && filter.values.length === 0) {
        return true;
    } else if (filter.type === AND && filter.filters.some(f => includesNoValues(f))){
        return true;
    } else {
        return false;
    }
}

// does f2 only narrow the resultset from f1
export function extendsFilter(f1=null, f2=null) {
    // ignore filters which are identical
    // include or exclude filters which add values
    if (f2 === null){
        return false
    } else if (f1 === null) {
        return true;
    }
    if (f1.colName && f1.colName === f2.colName) {
        if (f1.type === f2.type) {
            switch (f1.type) {
            case SET:
                return f1.mode === EXCLUDE
                    ? f2.values.length > f1.values.length && containsAll(f2.values, f1.values)
                    : f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
            case STARTS_WITH: return f2.value.length > f1.value.length && f2.value.indexOf(f1.value) === 0;
                // more cases here such as GT,LT
            default:
            }
        }

    } else if (f1.colname && f2.colName) {
        // different columns,always false
        return false;
    } else if (f2.type === AND && extendsFilters(f1, f2)) {
        return true;
    }

    // safe option is to assume false, causing filter to be re-applied to base data
    return false;
}

const byColName = (a, b) => a.colName === b.colName ? 0 : a.colName < b.colName ? -1 : 1;

function extendsFilters(f1, f2) {
    if (f1.colName) {
        const matchingFilter = f2.filters.find(f => f.colName === f1.colName);
        return filterEquals(matchingFilter, f1, true);
    } else if (f1.filters.length === f2.filters.length) {
        // if the only differences are extra values in an excludes filter or fewer values in an includes filter
        // then we are still extending the filter (i.e. narrowing the resultset)
        const a = f1.filters.sort(byColName);
        const b = f2.filters.slice().sort(byColName);

        for (let i = 0; i < a.length; i++) {
            if (!filterEquals(a[i], b[i], true) && !filterExtends(a[i], b[i])) {
                return false;
            }
        }
        return true;
    } else if (f2.filters.length > f1.filters.length){
        return f1.filters.every(filter1 => {
            const filter2 = f2.filters.find(f => f.colName === filter1.colName);
            return filterEquals(filter1, filter2, true); // could also allow f2 extends f1
        });
    }
}

export function includesColumn(filter, column) {
    if (!filter) {
        return false;
    }
    const { type, colName, filters } = filter;
    switch (type) {
    case 'AND': return filters.some(f => includesColumn(f, column));
    default: return colName === column.name;
    }
}

export function addFilter(existingFilter, filter) {
    console.log(`add filter ${JSON.stringify(filter)} to filter ${JSON.stringify(existingFilter)}`)
    if (!existingFilter) {
        return filter;
    } else if (!filter) {
        return existingFilter;
    } else if (existingFilter.type === 'AND' && filter.type === 'AND') {
        return { type: 'AND', filters: combine(existingFilter.filters, filter.filters) };
    } else if (existingFilter.type === 'AND') {
        return { type: 'AND', filters: replaceOrInsert(existingFilter.filters, filter) };
    } else if (filter.type === 'AND') {
        return { type: 'AND', filters: filter.filters.concat(existingFilter) };
    } else if (filterEquals(existingFilter, filter, true)) {
        return filter;
    } else if (sameColumn(existingFilter, filter)){
        return merge(existingFilter, filter);
    } else {
        return { type: 'AND', filters: [existingFilter, filter] };
    }
}

function replaceOrInsert(filters, filter) {
    if (filter.type === SET) {
        const idx = filters.findIndex(f => f.type === filter.type && f.colName === filter.colName);
        if (idx !== -1) {
            return filters.map((f, i) => i === idx ? filter : f);
        }
    }

    return filters.concat(filter);
}

function merge(f1, f2){
    const {type: t1, mode: m1} = f1;
    const {type: t2, mode: m2} = f2;      
    const sameType = t1 === t2 ? t1 : '';
    const sameMode = m1 === m2 ? m1 : '';
    console.log(`merge filters ${JSON.stringify(f1,null,2)} ${JSON.stringify(f2,null,2)}`)
    
    if (sameType === SET && !sameMode){
        // do the two sets cancel each other out ?
        if (f1.values.length === f2.values.length && f1.values.every(v => f2.values.includes(v))){  
            return null;
        } else if (m1 === EXCLUDE && m2 === INCLUDE){
            // do we have the same values in two modes ?
            if (f2.values.every(v => f1.values.includes(v))){
                return {
                    ...f1,
                    values: f1.values.filter(v => !f2.values.includes(v))
                }
            }
        }
    } else if (sameType === SET){
        return {
            ...f1,
            values: f1.values.concat(f2.values.filter(v => !f1.values.includes(v)))
        }
    }

    return f2;

}

function combine(existingFilters, replacementFilters) {

    // TODO need a safer REGEX here
    function equivalentType({ type: t1 }, { type: t2 }) {
        return (t1 === t2) || (t1[0] === t2[0]);
    }

    const replaces = (existingFilter, replacementFilter) => {
        return existingFilter.colName === replacementFilter.colName &&
            equivalentType(existingFilter, replacementFilter);
    };

    const stillApplicable = existingFilter => replacementFilters.some(
        replacementFilter => replaces(existingFilter, replacementFilter)) === false;

    return existingFilters.filter(stillApplicable).concat(replacementFilters);
}

export function removeFilter(sourceFilter, filterToRemove) {
    if (filterEquals(sourceFilter, filterToRemove, true)) {
        return null;
    } else if (sourceFilter.type !== 'AND') {
        throw Error(`removeFilter cannot remove ${JSON.stringify(filterToRemove)} from ${JSON.stringify(sourceFilter)}`);
    } else {
        const filters = sourceFilter.filters.filter(f => !filterEquals(f, filterToRemove));
        return filters.length > 0 ? { type: 'AND', filters } : null;
    }
}

export function splitFilterOnColumn(filter, columnName) {
    if (!filter){
        return [null,null];
    } else if (filter.colName === columnName) {
        return [filter,null];
    } else if (filter.type !== 'AND') {
        return [null, filter];
    } else {
        const [[columnFilter=null], filters] = partition(filter.filters, f => f.colName === columnName);
        return filters.length === 1
            ? [columnFilter,filters[0]]
            : [columnFilter, { type: 'AND', filters }];
    }
}

export function extractFilterForColumn(filter, columnName) {
    if (!filter) {
        return null;
    }
    const { type, colName } = filter;
    switch (type) {
    case 'AND': return collectFiltersForColumn(filter.filters, columnName);
    default: return colName === columnName ? filter : null;
    }
}

function collectFiltersForColumn(filters, columName){
    const results = [];
    filters.forEach(filter => {
        const ffc = extractFilterForColumn(filter, columName);
        if (ffc !== null){
            results.push(ffc);
        }
    })
    if (results.length === 1){
        return results[0];
    } else {
        return {
            type: AND,
            filters: results
        }
    }
}

export function removeFilterForColumn(sourceFilter, column) {
    const colName = column.name;
    if (!sourceFilter){
        return null;
    } else if (sourceFilter.colName === colName) {
        return null;
    } else if (sourceFilter.type !== 'AND') {
        throw Error(`removeFilter cannot remove ${column.name} from ${JSON.stringify(sourceFilter)}`);
    } else {
        const filters = sourceFilter.filters.filter(f => f.colName !== colName);
        return filters.length === 1
            ? filters[0]
            : { type: 'AND', filters };
    }
}

const sameColumn = (f1, f2) => f1.colName === f2.colName;

export function filterEquals(f1, f2, strict = false) {
    if (f1 && f1){
        const isSameColumn = sameColumn(f1,f2);
        if (!strict) {
            return isSameColumn;
        } else {
            return isSameColumn &&
                f1.type === f2.type && 
                f1.mode === f2.mode &&
                f1.value === f2.value &&
                sameValues(f1.values, f2.values);
        }
    } else {
        return false;
    }
}

// does f2 extend f1 ?
function filterExtends(f1, f2) {
    if (f1.type === SET && f1.mode !== EXCLUDE && f2.type === SET && f2.mode !== EXCLUDE) {
        return f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
    } else if (f1.type === SET && f1.mode === EXCLUDE && f2.type === SET && f2.mode === EXCLUDE) {
        return f2.values.length > f1.values.length && containsAll(f2.values, f1.values);
    } else {
        return false;
    }
}

//TODO roll this into next function
export function projectFilterData(filterRows) {
    return filterRows.map((row, idx) => [idx, 0, 0, null, row.name, row.count]);
}

// export function getDistinctValues(rows, key, ignoreDepth=false) {
//     const collector = stringCollector(false);
//     // const start = performance.now();
//     for (let i = 0, len = rows.length; i < len; i++) {
//         if (ignoreDepth || rows[i][System.DEPTH_FIELD] === 0){
//             collector.add(rows[i][key]);
//         }
//     }
//     const values = collector.values();
//     // const end = performance.now();
//     // console.log(`%ctook ${end - start} ms to build list of set values`, 'font-weight:bold;color:red;');

//     return values;

// }

export function getBinnedValues(rows, key, numberOfBins = 20) {
    const numbers = rows.map(row => row[key]);
    // const start = performance.now();
    const values = d3.histogram().thresholds(numberOfBins)(numbers).map((arr, i) => [i + 1, arr.length, arr.x0, arr.x1]);
    // const end = performance.now();
    // console.log(`%ctook ${end - start} ms to build histogram`, 'font-weight:bold;color:red;');
    // console.log(values);
    return values;

}

// The folowing are array utilities but they are defined here as they are not suitable for large arrays, so we'll
// keep them local to filters
function containsAll(superList, subList) {
    for (let i = 0, len = subList.length; i < len; i++) {
        if (superList.indexOf(subList[i]) === -1) {
            return false;
        }
    }
    return true;
}

// only suitable for small arrays of simple types (e.g. filter values)
function sameValues(arr1, arr2) {
    if (arr1 === arr2) {
        return true;
    } else if (arr1.length === arr2.length) {
        const a = arr1.slice().sort();
        const b = arr2.slice().sort();
        return a.join('|') === b.join('|');
    }
    return false;
}

function partition(list, test1, test2=null) {
    const results1 = [];
    const misses = [];
    const results2 = test2===null ? null : [];

    for (let i = 0; i < list.length; i++) {
        if (test1(list[i])) {
            results1.push(list[i]);
        } else if (test2 !== null && test2(list[i])) {
            results2.push(list[i]);
        } else {
            misses.push(list[i]);
        }
    }

    return test2 === null
        ? [results1, misses]
        : [results1, results2, misses];
}
