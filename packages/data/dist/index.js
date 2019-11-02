function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector(compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

function ascendingComparator(f) {
  return function(d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;

function extent(values, valueof) {
  let min;
  let max;
  if (valueof === undefined) {
    for (const value of values) {
      if (value != null) {
        if (min === undefined) {
          if (value >= value) min = max = value;
        } else {
          if (min > value) min = value;
          if (max < value) max = value;
        }
      }
    }
  } else {
    let index = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null) {
        if (min === undefined) {
          if (value >= value) min = max = value;
        } else {
          if (min > value) min = value;
          if (max < value) max = value;
        }
      }
    }
  }
  return [min, max];
}

function identity(x) {
  return x;
}

var array = Array.prototype;

var slice = array.slice;

function constant(x) {
  return function() {
    return x;
  };
}

function range(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
}

var e10 = Math.sqrt(50),
    e5 = Math.sqrt(10),
    e2 = Math.sqrt(2);

function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10) step1 *= 10;
  else if (error >= e5) step1 *= 5;
  else if (error >= e2) step1 *= 2;
  return stop < start ? -step1 : step1;
}

function sturges(values) {
  return Math.ceil(Math.log(values.length) / Math.LN2) + 1;
}

function bin() {
  var value = identity,
      domain = extent,
      threshold = sturges;

  function histogram(data) {
    if (!Array.isArray(data)) data = Array.from(data);

    var i,
        n = data.length,
        x,
        values = new Array(n);

    for (i = 0; i < n; ++i) {
      values[i] = value(data[i], i, data);
    }

    var xz = domain(values),
        x0 = xz[0],
        x1 = xz[1],
        tz = threshold(values, x0, x1);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) {
      tz = tickStep(x0, x1, tz);
      tz = range(Math.ceil(x0 / tz) * tz, x1, tz); // exclusive
    }

    // Remove any thresholds outside the domain.
    var m = tz.length;
    while (tz[0] <= x0) tz.shift(), --m;
    while (tz[m - 1] > x1) tz.pop(), --m;

    var bins = new Array(m + 1),
        bin;

    // Initialize bins.
    for (i = 0; i <= m; ++i) {
      bin = bins[i] = [];
      bin.x0 = i > 0 ? tz[i - 1] : x0;
      bin.x1 = i < m ? tz[i] : x1;
    }

    // Assign data to bins by value, ignoring any outside the domain.
    for (i = 0; i < n; ++i) {
      x = values[i];
      if (x0 <= x && x <= x1) {
        bins[bisectRight(tz, x, 0, m)].push(data[i]);
      }
    }

    return bins;
  }

  histogram.value = function(_) {
    return arguments.length ? (value = typeof _ === "function" ? _ : constant(_), histogram) : value;
  };

  histogram.domain = function(_) {
    return arguments.length ? (domain = typeof _ === "function" ? _ : constant([_[0], _[1]]), histogram) : domain;
  };

  histogram.thresholds = function(_) {
    return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_), histogram) : threshold;
  };

  return histogram;
}

const EQUALS = 'EQ';
const GREATER_THAN = 'GT';
const GREATER_EQ = 'GE';
const LESS_THAN = 'LT';
const LESS_EQ = 'LE';
const AND = 'AND';
const OR = 'OR';
const STARTS_WITH = 'SW';
const NOT_STARTS_WITH = 'NOT_SW';
const IN = 'IN';
const NOT_IN = 'NOT_IN';

const SET_FILTER_DATA_COLUMNS = [
    {name: 'name'}, 
    {name: 'count', width: 40}, 
    {name: 'totalCount', width: 40}
];

const BIN_FILTER_DATA_COLUMNS = [
    {name: 'bin'}, 
    {name: 'count'}, 
    {name: 'bin-lo'},
    {name: 'bin-hi'}
];


function getFilterColumn(column) {
    return column.isGroup ? column.columns[0] : column;
}
function functor(columnMap, filter) {
    //TODO convert filter to include colIdx ratherthan colName, so we don't have to pass cols
    switch (filter.type) {
    case IN: return testInclude(columnMap, filter);
    case NOT_IN: return testExclude(columnMap, filter);
    case EQUALS: return testEQ(columnMap, filter);
    case GREATER_THAN: return testGT(columnMap, filter);
    case GREATER_EQ: return testGE(columnMap, filter);
    case LESS_THAN: return testLT(columnMap, filter);
    case LESS_EQ: return testLE(columnMap, filter);
    case STARTS_WITH: return testSW(columnMap, filter);
    case NOT_STARTS_WITH: return testSW(columnMap, filter, true);
    case AND: return testAND(columnMap, filter);
    case OR: return testOR(columnMap, filter);
    default:
        console.log(`unrecognized filter type ${filter.type}`);
        return () => true;
    }
}

function testAND(cols, f) {
    const filters = f.filters.map(f1 => functor(cols, f1));
    return row => filters.every(fn => fn(row));
}

function testOR(cols, f) {
    const filters = f.filters.map(f1 => functor(cols, f1));
    return row => filters.some(fn => fn(row));
}

function testSW(cols, f, inversed = false) {
    const value = f.value.toLowerCase();
    return inversed
        ? row => row[cols[f.colName]].toLowerCase().indexOf(value) !== 0
        : row => row[cols[f.colName]].toLowerCase().indexOf(value) === 0;
   
}

function testGT(cols, f) {
    return row => row[cols[f.colName]] > f.value;
}

function testGE(cols, f) {
    return row => row[cols[f.colName]] >= f.value;
}

function testLT(cols, f) {
    return row => row[cols[f.colName]] < f.value;
}

function testLE(cols, f) {
    return row => row[cols[f.colName]] <= f.value;
}

function testInclude(cols, f) {
    // eslint-disable-next-line eqeqeq 
    return row => f.values.findIndex(val => val == row[cols[f.colName]]) !== -1;
}

// faster to convert values to a keyed map
function testExclude(cols, f) {
    // eslint-disable-next-line eqeqeq 
    return row => f.values.findIndex(val => val == row[cols[f.colName]]) === -1;
}

function testEQ(cols, f) {
    return row => row[cols[f.colName]] === f.value;
}

function shouldShowFilter(filterColumnName, column) {
    const filterColumn = getFilterColumn(column);
    if (filterColumn.isGroup) {
        return filterColumn.columns.some(col => col.name === filterColumnName);
    } else {
        return filterColumnName === filterColumn.name;
    }
}

function includesNoValues(filter) {
    // TODO make sure we catch all cases...
    if (!filter){
        return false;
    } else if (filter.type === IN && filter.values.length === 0) {
        return true;
    } else if (filter.type === AND && filter.filters.some(f => includesNoValues(f))){
        return true;
    } else {
        return false;
    }
}

function includesAllValues(filter) {
    if (!filter){
        return false;
    } else if (filter.type === NOT_IN && filter.values.length === 0) {
        return true;
    } else {
        return false;
    }
}

// does f2 only narrow the resultset from f1
function extendsFilter(f1=null, f2=null) {
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
            case IN:
                return f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
            case NOT_IN: 
                return f2.values.length > f1.values.length && containsAll(f2.values, f1.values);
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

function addFilter(existingFilter, filter) {

    if (includesNoValues(filter)){
        const {colName} = filter;
        existingFilter = removeFilterForColumn(existingFilter, {name:colName});
    } else if (includesAllValues(filter)){
        // A filter that returns all values is a way to remove filtering for this column 
        return removeFilterForColumn(existingFilter, {name: filter.colName});
    }

    if (!existingFilter) {
        return filter;
    } else if (!filter) {
        return existingFilter;
    }
   
    if (existingFilter.type === AND && filter.type === AND) {
        return { type: 'AND', filters: combine(existingFilter.filters, filter.filters) };
    } else if (existingFilter.type === 'AND') {
        const filters = replaceOrInsert(existingFilter.filters, filter);
        return filters.length > 1
            ? { type: 'AND', filters  }
            : filters[0];
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

// If we add an IN filter and there is an existing NOT_IN, we would always expect the IN
// values to exist in the NOT_IN set (as long as user interaction is driving the filtering)
function replaceOrInsert(filters, filter) {
    const {type, colName, values} = filter;
    if (type === IN) {
        // see if we have a NOT_IN entry
        let idx = filters.findIndex(f => f.type === NOT_IN && f.colName === colName);
        if (idx !== -1){
            const {values: existingValues} = filters[idx];
            if (values.every(value => existingValues.indexOf(value) !== -1)){
                if (values.length === existingValues.length){
                    // we simply remove the existing NOT_IN filter ...
                    return filters.filter((f, i) => i !== idx);
                } else {
                    // ... or strip the IN values from the NOT_IN values
                    let newValues = existingValues.filter(value => !values.includes(value));
                    return filters.map((filter,i) => i === idx ? {...filter, values: newValues}: filter)

                }
            }
            else if (values.some(value => existingValues.indexOf(value) !== -1)){
                console.log(`partial overlap between IN and NOT_IN`);

            }
        }


        idx = filters.findIndex(f => f.type === IN && f.colName === filter.colName);
        if (idx !== -1) {
            return filters.map((f, i) => i === idx ? merge(f, filter) : f);
        }
    }

    return filters.concat(filter);
}

function merge(f1, f2){
    const {type: t1} = f1;
    const {type: t2} = f2;      
    const sameType = t1 === t2 ? t1 : '';

    if (includesNoValues(f2)){
        return f2;
    } else if ((t1 === IN && t2 === NOT_IN) || (t1 === NOT_IN && t2 === IN)){
        // do the two sets cancel each other out ?
        if (f1.values.length === f2.values.length && f1.values.every(v => f2.values.includes(v))){  
            // DOn't think this is right
            return null;
        } else if (t1 === NOT_IN){
            if (f2.values.every(v => f1.values.includes(v))){
                return {
                    ...f1,
                    values: f1.values.filter(v => !f2.values.includes(v))
                }
            }
        }
    } else if (sameType === IN || sameType === NOT_IN){
        return {
            ...f1,
            values: f1.values.concat(f2.values.filter(v => !f1.values.includes(v)))
        }
    } else if (sameType === STARTS_WITH){
        return {
            type: OR,
            filters: [f1, f2]
        }
    } else if (sameType === NOT_STARTS_WITH){
        return {
            type: AND,
            filters: [f1, f2]
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

function splitFilterOnColumn(filter, columnName) {
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

const overrideColName = (filter, colName) => {
    const {type} = filter;
    if (type === AND || type === OR){
        return {
            type,
            filters: filter.filters.map(f => overrideColName(f, colName))
        }
    } else {
        return {...filter, colName}
    }
};

function extractFilterForColumn(filter, columnName) {
    if (!filter) {
        return null;
    }
    const { type, colName } = filter;
    switch (type) {
        case AND: 
        case OR: 
            return collectFiltersForColumn(type, filter.filters, columnName);

        default:
            return colName === columnName ? filter : null;
    }
}

function collectFiltersForColumn(type, filters, columName){
    const results = [];
    filters.forEach(filter => {
        const ffc = extractFilterForColumn(filter, columName);
        if (ffc !== null){
            results.push(ffc);
        }
    });
    if (results.length === 1){
        return results[0];
    } else {
        return {
            type,
            filters: results
        }
    }
}

function includesColumn(filter, column) {
    if (!filter) {
        return false;
    }
    const { type, colName, filters } = filter;
    switch (type) {
    case AND: return filters.some(f => includesColumn(f, column));
    default: return colName === column.name;
    }
}

function removeFilterForColumn(sourceFilter, column) {
    const colName = column.name;
    if (!sourceFilter){
        return null;
    } else if (sourceFilter.colName === colName) {
        return null;
    } else if (sourceFilter.type === AND || sourceFilter.type === OR) {
        const {type, filters} = sourceFilter;
        const otherColFilters = filters.filter(f => f.colName !== colName);
        switch(otherColFilters.length){
            case 0: return null;
            case 1: return otherColFilters[0];
            default: return { type, otherColFilters } 
        }
    } else {
        return sourceFilter;
    }
}

const sameColumn = (f1, f2) => f1.colName === f2.colName;

function filterEquals(f1, f2, strict = false) {
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
    if (f1.type === IN && f2.type === IN) {
        return f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
    } else if (f1.type === NOT_IN && f2.type === NOT_IN) {
        return f2.values.length > f1.values.length && containsAll(f2.values, f1.values);
    } else {
        return false;
    }
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

const SORT_ASC = 'asc';

const setFilterColumnMeta = metaData(SET_FILTER_DATA_COLUMNS);
const binFilterColumnMeta = metaData(BIN_FILTER_DATA_COLUMNS);

function mapSortCriteria(sortCriteria, columnMap) {
    return sortCriteria.map(s => {
        if (typeof s === 'string') {
            return [columnMap[s], 'asc'];
        } else if (Array.isArray(s)) {
            const [columnName, sortDir] = s;
            return [columnMap[columnName], sortDir || SORT_ASC];
        } else {
            throw Error('columnUtils.mapSortCriteria invalid input');
        }

    });
}

const toKeyedColumn = (column, key) =>
    typeof column === 'string'
        ? { key, name: column }
        : typeof column.key === 'number'
            ? column
            : {...column, key};

const toColumn = column =>
    typeof column === 'string'
        ? { name: column }
        : column;

function buildColumnMap(columns){
    if (columns){
        return columns.reduce((map, column, i) => {
            if (typeof column === 'string'){
                map[column] = i;
            } else if (typeof column.key === 'number') {
                map[column.name] = column.key;
            } else {
                map[column.name] = i;
            }
            return map;
        },{})
    } else {
        return null;
    }
}

function projectColumns(map, columns, meta){
    const length = columns.length;
    const {IDX, RENDER_IDX, DEPTH, COUNT, KEY, SELECTED} = meta;
    return (startIdx, selectedRows=[]) => (row,i) => {
        const out = [];
        for (let i=0;i<length;i++){
            const colIdx = map[columns[i].name];
            out[i] = row[colIdx];
        }
        // assume row[0] is key for now
        // out.push(startIdx+i, 0, 0, row[0]);
        out[IDX] = startIdx+i;
        out[RENDER_IDX] = 0;
        out[DEPTH] = 0;
        out[COUNT] = 0;
        out[KEY] = row[0];
        out[SELECTED] = 0;
        return out;
    }
}

function projectColumnsFilter(map, columns, meta, filter){
    const length = columns.length;
    const {IDX, RENDER_IDX, DEPTH, COUNT, KEY, SELECTED} = meta;

    // this is filterset specific where first col is always value
    const fn = filter ? functor(map, overrideColName(filter, 'name'))  : () => true;
    return startIdx => (row,i) => {
        const out = [];
        for (let i=0;i<length;i++){
            const colIdx = map[columns[i].name];
            out[i] = row[colIdx];
        }
        // assume row[0] is key for now
        // out.push(startIdx+i, 0, 0, row[0]);
        out[IDX] = startIdx+i;
        out[RENDER_IDX] = 0;
        out[DEPTH] = 0;
        out[COUNT] = 0;
        out[KEY] = row[0];
        out[SELECTED] = fn(row) ? 1 : 0;

        return out;
    }
}

function getFilterType(column){
    return column.filter || getDataType(column);
}

// {name: 'Price', 'type': {name: 'price'}, 'aggregate': 'avg'},
// {name: 'MarketCap', 'type': {name: 'number','format': 'currency'}, 'aggregate': 'sum'},

function getDataType({type=null}){
    if (type === null){
        return 'set';
    } else if (typeof type === 'string'){
        return type;
    } else {
        switch(type.name){
            case 'price':
                return 'number';
            default:
                return type.name;
        }
    }

}

//TODO cache result by length
function metaData(columns){
    const start = columns.length === 0
        ? -1
        : Math.max(...columns.map((column, idx) => typeof column.key === 'number' ? column.key : idx));
    return {
        IDX: start + 1,
        RENDER_IDX: start + 2,
        DEPTH: start + 3,
        COUNT: start + 4,
        KEY: start + 5,
        SELECTED: start + 6,
        PARENT_IDX: start + 7,
        IDX_POINTER: start + 8,
        FILTER_COUNT: start + 9,
        NEXT_FILTER_IDX: start + 10,
        count: start + 11
    }
}

const DataTypes = {
    ROW_DATA: 'rowData',
    FILTER_DATA: 'filterData',
    FILTER_BINS: 'filterBins'
};

const ASC = 'asc';
const DSC = 'dsc';

const EMPTY_MAP = {};

function sortableFilterSet(filterSet){
    if (filterSet.length === 0){
        return filterSet;
    } else if (Array.isArray(filterSet[0])){
        return filterSet;
    } else {
        return filterSet.map(idx => [idx,null]);
    }
}

function sortExtend(sortSet, rows, sortCols, newSortCols, columnMap){
    sort2ColsAdd1(sortSet, rows, newSortCols, columnMap);
}

function sort(sortSet,rows,sortCols,columnMap){
    const sortCriteria = mapSortCriteria(sortCols, columnMap);
    const count = sortCriteria.length;
    const sortFn = count === 1 ? sort1 : count === 2 ? sort2 : count === 3 ? sort3 : sortAll;
    sortFn(sortSet,rows,sortCriteria);
}

function sort2ColsAdd1(sortSet, rows, sortCols, columnMap){
    const len = sortSet.length;
    const sortCriteria = mapSortCriteria(sortCols, columnMap);
    const [colIdx2] = sortCriteria[1];
    for (let i=0;i<len;i++){
        sortSet[i][2] = rows[sortSet[i][0]][colIdx2];
    }
    sortSet.sort((a,b) => {
        return a[1] > b[1] ? 1 : b[1] > a[1] ? -1
            : a[2] > b[2] ? 1 : b[2] > a[2] ? -1 : 0;
    });
}

function sort1(sortSet,rows,[[colIdx, direction]]){
    const len = sortSet.length;
    for (let i=0;i<len;i++){
        const idx = sortSet[i][0];
        sortSet[i][1] = rows[idx][colIdx];
    }
    if (direction === ASC){
        sortSet.sort((a,b) => {
            return a[1] > b[1] ? 1 : b[1] > a[1] ? -1 : 0;
        });
    } else {
        sortSet.sort((a,b) => {
            return a[1] > b[1] ? -1 : b[1] > a[1] ? 1 : 0;
        });
    }
}

function sort2(sortSet,rows,sortCriteria){
    const len = rows.length;
    const [colIdx1] = sortCriteria[0];
    const [colIdx2] = sortCriteria[1];
    for (let i=0;i<len;i++){
        sortSet[i][0] = i;
        sortSet[i][1] = rows[i][colIdx1];
        sortSet[i][2] = rows[i][colIdx2];
    }
    sortSet.sort((a,b) => {
        return a[1] > b[1] ? 1 : b[1] > a[1] ? -1
            : a[2] > b[2] ? 1 : b[2] > a[2] ? -1 : 0;
    });
}

function sort3(/*sortSet,rows,sortCriteria*/){

}
function sortAll(/*sortSet,rows,sortCriteria*/){

}

function sortByToMap(sortCriteria=null){
    return sortCriteria === null
        ? EMPTY_MAP
        : sortCriteria.reduce((map, col, i) => {
            if (typeof col === 'string') {
                map[col] = i + 1;
            } else {
                const [colName, sortDir] = col;
                map[colName] = sortDir === ASC ? (i + 1) : -1 * (i + 1);
            }
            return map;
        }, {});

}

function sortReversed(cols1, cols2, colCount=cols1.length){
    if (cols1 && cols2 && cols1.length > 0 && cols2.length === colCount){
        for (let i=0;i<cols1.length; i++){
            let [col1, direction1=ASC] = cols1[i];
            let [col2, direction2=ASC] = cols2[i];
            if (col1 !== col2 || direction1 === direction2){
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}


function GROUP_ROW_TEST(group, row, [colIdx, direction]) {
    if (group === row) {
        return 0;
    } else {
        let a1 = direction === 'dsc' ? row[colIdx] : group[colIdx];
        let b1 = direction === 'dsc' ? group[colIdx] : row[colIdx];
        if (b1 === null || a1 > b1) {
            return 1;
        } else if (a1 == null || a1 < b1) {
            return -1;
        }
    }
}

function ROW_SORT_TEST(a, b, [colIdx, direction]) {
    if (a === b) {
        return 0;
    } else {
        let a1 = direction === 'dsc' ? b[colIdx] : a[colIdx];
        let b1 = direction === 'dsc' ? a[colIdx] : b[colIdx];
        if (b1 === null || a1 > b1) {
            return 1;
        } else if (a1 == null || a1 < b1) {
            return -1;
        }
    }
}

// sort null as low. not high
function sortBy(cols, test=ROW_SORT_TEST) {
    return function (a, b) {
        for (let i = 0, result = 0, len=cols.length; i < len; i++) {
            if (result = test(a, b, cols[i])) {
                return result;
            }
        }
        return 0;
    };
}

// sorter is the sort comparator used to sort rows, we want to know
// where row would be positioned in this sorted array. Return the
// last valid position.
function sortPosition(rows, sorter, row, positionWithinRange = 'last-available') {

    function selectFromRange(pos) {

        const len = rows.length;
        const matches = p => sorter(rows[p], row) === 0;

        //TODO this will depend on the sort direction
        if (positionWithinRange === 'last-available') {
            while (pos < len && matches(pos)) {
                pos += 1;
            }
        } else if (positionWithinRange === 'first-available') {
            while (pos > 0 && matches(pos - 1)) {
                pos -= 1;
            }
        }

        return pos;

    }

    function find(lo, hi) {

        let mid = lo + Math.floor((hi - lo) / 2);
        let pos = sorter(rows[mid], row);

        if (lo === mid) {
            return selectFromRange(pos >= 0 ? lo : hi);
        }
        if (pos >= 0) {
            hi = mid;
        } else {
            lo = mid;
        }
        return find(lo, hi);
    }

    if (rows.length === 0){
        return 0;
    } else {
        return find(0, rows.length);
    }

}

const NULL_RANGE = {lo: 0,hi: 0};

// If the requested range overlaps the last sent range, we only need send the
// newly exposed section of the range. The client will manage dropping off
// the expired section.
//
// |----------------------------------| _range
//  ++++++|----------------------------------| prevRange
//  
//
//
//  |------------------------------------| _range
//  |----------------------------------|+  prevRange
//TODO do we still need these calls to getFullRange ?
function getDeltaRange(oldRange, newRange){
    const {lo: oldLo, hi: oldHi} = oldRange /*getFullRange(oldRange)*/;
    const {lo: newLo, hi: newHi} = newRange /*getFullRange(newRange)*/;

    if (newLo >= oldLo && newHi <= oldHi){
        // reduced range, no delta
        return {lo: newHi, hi: newHi};

    } else if (newLo >= oldHi || newHi < oldLo){
        return {lo: newLo, hi: newHi};
    } else if (newLo === oldLo && newHi === oldHi){
        return {lo: oldHi,hi: oldHi};
    } else {
        return {
            lo: newLo < oldLo ? newLo: oldHi,
            hi: newHi > oldHi ? newHi: oldLo
        };
    }
}

function resetRange({lo,hi,bufferSize=0}){
    return {
        lo: 0,
        hi: hi-lo,
        bufferSize,
        reset: true
    };
}

function getFullRange({lo,hi,bufferSize=0}){
    return {
        lo: Math.max(0, lo - bufferSize),
        hi: hi + bufferSize
    };
}

function withinRange(range, index, offset=0) {
    return index-offset >= range.lo && index-offset < range.hi;
}

const SAME = 0;
const FWD = 2;
const BWD = 4;
const CONTIGUOUS = 8;
const OVERLAP = 16;
const REDUCE = 32;
const EXPAND = 64;
const NULL = 128;

const RangeFlags = {
    SAME,
    FWD,
    BWD,
    CONTIGUOUS,
    OVERLAP,
    REDUCE,
    EXPAND,
    NULL
};

RangeFlags.GAP = ~(CONTIGUOUS | OVERLAP | REDUCE);

function compareRanges(range1, range2){
    if (range2.lo === 0 && range2.hi === 0){
        return NULL;
    } else if (range1.lo === range2.lo && range1.hi === range2.hi){
        return SAME;
    } else if (range2.hi > range1.hi){
        if (range2.lo > range1.hi){
            return FWD;
        } else if (range2.lo === range1.hi){
            return FWD + CONTIGUOUS;
        } else if (range2.lo >= range1.lo){
            return FWD + OVERLAP;
        } else {
            return EXPAND;
        }
    } else if (range2.lo < range1.lo){
        if (range2.hi < range1.lo){
            return BWD;
        } else if (range2.hi === range1.lo){
            return BWD + CONTIGUOUS;
        } else if (range2.hi > range1.lo){
            return BWD + OVERLAP;
        } else {
            return EXPAND;
        }
    } else if (range2.lo > range1.lo) {
        return REDUCE + FWD;
    } else {
        return REDUCE + BWD
    }
}

const DEFAULT_OPTIONS = {
    startIdx: 0,
    rootIdx: null,
    rootExpanded: true,
    baseGroupby: []
};

function lowestIdxPointer(groups, IDX, DEPTH, start, depth){
    let result = Number.MAX_SAFE_INTEGER;
    for (let i=start; i<groups.length; i++){
        const group = groups[i];
        const absDepth = Math.abs(group[DEPTH]);

        if (absDepth > depth){
            break;
        } else if (absDepth === depth) {
            const idx = group[IDX];
            if (typeof idx === 'number' && idx < result){
                result = idx;
            }
        }
    }

    return result === Number.MAX_SAFE_INTEGER ? undefined : result;

}

function getCount(groupRow, PRIMARY_COUNT, FALLBACK_COUNT){
    return typeof groupRow[PRIMARY_COUNT] === 'number'
        ? groupRow[PRIMARY_COUNT]
        : groupRow[FALLBACK_COUNT];
}

class SimpleTracker {
    constructor(levels){
        this.levels = Array(levels).fill(0).reduce((acc,el,i) => {
            acc[i+1] = {key: null, pos: null, pPos: null};
            return acc;
        },{});
    }
    set(depth,pos,groupKey){
        if (this.levels){
            const level = this.levels[Math.abs(depth)];
            if (level && level.key !== groupKey){
                if (level.key !== null){
                    level.pPos = level.pos;
                }
                level.key = groupKey;
                level.pos = pos;
            }
        }
    }
    
    hasParentPos(level){
        return this.levels[level+1] && this.levels[level+1].pos !== null
    }
    
    parentPos(level){
        return this.levels[level+1].pos
    }
    
    hasPreviousPos(level){
        return this.levels[level] && this.levels[level].pPos !== null
    }
    
    previousPos(level){
        return this.levels[level].pPos;
    }
}

class GroupIdxTracker {
    constructor(levels){
        this.idxAdjustment = 0;
        this.maxLevel = levels+1;
        this.levels = levels > 0
            ? Array(levels).fill(0).reduce((acc,el,i) => {
                acc[i+2] = {key: null, current: 0, previous: 0};
                return acc;
            },{})
            : null;
    }

    increment(count){
        this.idxAdjustment += count;
        if (this.levels){
            for (let i=2; i<this.maxLevel+1;i++){
                this.levels[i].current += count;
            }
        }
    }

    previous(level){
        return (this.levels && this.levels[level] && this.levels[level].previous) || 0
    }

    hasPrevious(level){
        return this.previous(level) > 0;
    }

    get(idx){
        return this.levels === null ? null: this.levels[idx]
    }

    set(depth,groupKey){
        if (this.levels){
            const level = this.levels[depth];
            if (level && level.key !== groupKey){
                if (level.key !== null){
                    level.previous += level.current;
                    level.current = 0;
                }
                level.key = groupKey;
            }
        }
    }
}

const itemIsNumeric = item => !isNaN(parseInt(item,10));
const numerically = (a,b) => parseInt(a)-parseInt(b);

function sortKeys(o){
    const keys = Object.keys(o);
    if (keys.every(itemIsNumeric)){
        return keys.sort(numerically)
    } else {
        return keys.sort()
    }
}

function fillNavSetsFromGroups(groups, sortSet, sortIdx=0, filterSet=null, filterIdx, filterLen){
    const keys = sortKeys(groups);
    const filtered = filterSet !== null;
    const filterIndices = filtered ? filterSet.slice(filterIdx,filterLen) : null;
    for (let i = 0 ; i<keys.length;i++){
        const groupedRows = groups[keys[i]];
        if (Array.isArray(groupedRows)){
            for (let j=0,len=groupedRows.length;j<len;j++){
                const rowIdx = groupedRows[j];
                sortSet[sortIdx] = rowIdx;
                sortIdx += 1;
                // this could be prohibitively slow (the includes test) ...
                if (filtered && filterIndices.includes(rowIdx)){
                    filterSet[filterIdx] = rowIdx;
                    filterIdx += 1;
                }
            }
        } else {
            sortIdx = fillNavSetsFromGroups(groupedRows, sortSet, sortIdx);
        }
    }
    return sortIdx;
}

// WHY is param order different from groupLeafRows
function groupRows(rows, sortSet, columns, columnMap, groupby, options = DEFAULT_OPTIONS) {
    const { startIdx = 0, length=rows.length, rootIdx = null, baseGroupby = [], groups=[], rowParents=null,
        filterLength, filterSet, filterFn: filter } = options;
    let {groupIdx=-1, filterIdx} = options;

    const aggregations = findAggregatedColumns(columns, columnMap, groupby);
    const groupedLeafRows = groupLeafRows(sortSet, rows, groupby, startIdx, length);
    fillNavSetsFromGroups(groupedLeafRows, sortSet, startIdx, filterSet, filterIdx, filterLength);

    const levels = groupby.length;
    const currentGroups = Array(levels).fill(null);
    const { IDX, DEPTH, FILTER_COUNT, NEXT_FILTER_IDX } = metaData(columns);

    let parentIdx = rootIdx;
    let leafCount = 0;

    for (let i = startIdx, len=startIdx+length; i < len; i++){
        const rowIdx = sortSet[i];
        const row = rows[rowIdx];

        for (let level = 0; level < levels; level++) {
            const [columnIdx] = groupby[level];
            const currentGroup = currentGroups[level];
            const groupValue = row[columnIdx];
            // as soon as we identify a group change, each group at that level and below
            // is then aggregated and new group(s) initiated. 
            if (currentGroup === null || currentGroup[columnIdx] !== groupValue) {
                if (currentGroup !== null) {
                    // as soon as we know we're regrouping, aggregate the open groups, in reverse order
                    for (let ii = levels - 1; ii >= level; ii--) {
                        const group = currentGroups[ii];
                        aggregate(group, groups, sortSet, rows, columns, aggregations, leafCount, filter);
                        if (filterSet && Math.abs(group[DEPTH]) === 1 && group[FILTER_COUNT] > 0){
                            group[NEXT_FILTER_IDX] = filterIdx;
                            filterIdx += group[FILTER_COUNT];
                        }
                    }

                    leafCount = 0;
                }
                for (let ii = level; ii < levels; ii++) {
                    groupIdx += 1;
                    parentIdx = ii === 0 ? rootIdx : currentGroups[ii - 1][IDX];
                    const depth = levels - ii;
                    // for first-level groups, row pointer is a pointer into the sortSet
                    const childIdx = depth === 1
                        ? i
                        : groupIdx+1;

                    const groupRow = currentGroups[ii] = GroupRow(row, depth, groupIdx, childIdx, parentIdx, groupby, columns, columnMap, baseGroupby);
                    groups.push(groupRow);
                }
                break; // do not continue looping once we identify the change point
            }
        }
        rowParents && (rowParents[rowIdx] = groupIdx);
        leafCount += 1;
    }

    for (let i = levels - 1; i >= 0; i--) {
        if (currentGroups[i] !== null){
            const group = currentGroups[i];
            aggregate(group, groups, sortSet, rows, columns, aggregations, leafCount, filter);
            if (filterSet && Math.abs(group[DEPTH]) === 1 && group[FILTER_COUNT] > 0){
                group[NEXT_FILTER_IDX] = filterIdx;
            }
        }
    }
    return groups;

}

// Checks very specifically for new cols added at end 
function groupbyExtendsExistingGroupby(groupBy, existingGroupBy) {
    return (groupBy.length > existingGroupBy.length &&
        existingGroupBy.every((g, i) => g[0] === groupBy[i][0]));
}

// doesn't care from which position col is removed, as long as it is not the first
function groupbyReducesExistingGroupby(groupby, existingGroupby) {
    return (existingGroupby.length > groupby.length &&
        groupby[0][0] === existingGroupby[0][0] &&
        groupby.every(([key]) => existingGroupby.find(([key2]) => key2 === key)));
}

function groupbySortReversed(groupBy, existingGroupBy) {
    const [col] = findSortedCol(groupBy, existingGroupBy);
    return col !== null;
}

function findDoomedColumnDepths(groupby, existingGroupby) {
    const count = existingGroupby.length;
    return existingGroupby.reduce(
        (results, [colIdx], idx) => {
            if (!groupby.some(group => group[0] === colIdx)) {
                results.push(count - idx);
            }
            return results;
        }, []);
}

function findSortedCol(groupby, existingGroupby) {
    let results = [null];
    let len1 = groupby && groupby.length;
    let len2 = existingGroupby && existingGroupby.length;
    if (len1 && len2 && len1 === len2) {

        for (let i = 0; i < len1; i++) {
            if (groupby[i][0] !== existingGroupby[i][0]) {
                return results;
            } else if (groupby[i][1] !== existingGroupby[i][1]) {
                results[0] = i;
                results[1] = len1 - i;
            }
        }
    }
    return results;
}

function byKey([key1], [key2]) {
    return key1 > key2 ? 1 : key2 > key1 ? -1 : 0;
}

const EMPTY = {};
function getGroupStateChanges(groupState, existingGroupState = null, baseKey = '', groupIdx = 0) {
    const results = [];
    const entries = Object.entries(groupState);

    entries.forEach(([key, value]) => {
        if (value && (existingGroupState === null || !existingGroupState[key])) {
            results.push([baseKey + key, groupIdx, true]);
            if (value !== null && typeof value === 'object' && Object.keys(value).length > 0) {
                const diff = getGroupStateChanges(value, EMPTY, baseKey + key + '/', groupIdx + 1);
                if (diff.length) {
                    results.push(...diff);
                }
            }
        } else if (value) {
            const diff = getGroupStateChanges(value, existingGroupState[key], baseKey + key + '/', groupIdx + 1);
            if (diff.length) {
                results.push(...diff);
            }
        }
    });

    if (existingGroupState !== null && typeof existingGroupState === 'object') {
        Object.entries(existingGroupState).forEach(([key, value]) => {
            if (value && !groupState[key]) {
                results.push([baseKey + key, groupIdx, false]);
            }
        });
    }

    return results.sort(byKey);
}

// should be called toggleColumnInGroupBy
function updateGroupBy(existingGroupBy = null, column/*, replace = false*/) {
    console.log(``);
    if (existingGroupBy === null) {
        return [[column.name, ASC]];
    } else {
        return indexOfCol(column.name, existingGroupBy) === -1
            ? existingGroupBy.concat([[column.name, ASC]])
            : existingGroupBy.length === 1
                ? null
                : existingGroupBy.filter(([colName]) => colName !== column.name);
    }
}

function indexOfCol(key, cols = null) {
    if (cols !== null) {
        for (let i = 0; i < cols.length; i++) {
            // check both while we transition from groupBy to extendedGroupby
            // groupBy = [colName, dir] extendedGroupby = [colIdx, dir,colName]
            const [col1, , col2] = cols[i];
            if (col1 === key || col2 === key) {
                return i;
            }
        }
    }
    return -1;
}

// export function countNestedRows(rows, idx, depth) {
//     const DEPTH = Data.DEPTH_FIELD;
//     let count = 0;
//     for (let i = idx, len = rows.length;
//         i < len && Math.abs(rows[i][DEPTH]) < depth;
//         i++) {
//         count += 1;
//     }
//     return count;
// }

// TBC
// export function countGroupMembers(groupedRows) {
//     const results = [];
//     const groups = [];
//     let currentGroup = null;

//     for (let i = 0; i < groupedRows.length; i++) {
//         let [, depth] = groupedRows[i];
//         if (depth === LEAF_DEPTH) {
//             currentGroup.count += 1;
//         } else {
//             depth = Math.abs(depth);
//             while (currentGroup && depth >= currentGroup.depth) {
//                 const completedGroup = groups.shift();
//                 const group = results[completedGroup.i];
//                 if (group[Data.COUNT_FIELD] !== completedGroup.count) {
//                     const newGroup = group.slice();
//                     newGroup[Data.COUNT_FIELD] = completedGroup.count;
//                     results[completedGroup.i] = newGroup;
//                 }
//                 groups.forEach(higherLevelGroup => higherLevelGroup.count += completedGroup.count);
//                 ([currentGroup] = groups);
//             }

//             currentGroup = { i, depth, count: 0 };
//             groups.unshift(currentGroup);
//         }

//         results[i] = groupedRows[i];

//     }

//     while (currentGroup) {
//         const completedGroup = groups.shift();
//         const group = results[completedGroup.i];
//         if (group[Data.COUNT_FIELD] !== completedGroup.count) {
//             const newGroup = group.slice();
//             newGroup[Data.COUNT_FIELD] = completedGroup.count;
//             results[completedGroup.i] = newGroup;
//         }
//         groups.forEach(higherLevelGroup => higherLevelGroup.count += completedGroup.count);
//         ([currentGroup] = groups);
//     }

//     return results;
// }

function allGroupsExpanded(groups, group, {DEPTH, PARENT_IDX}){

    do {
        if (group[DEPTH] < 0){
            return false;
        }
        group = groups[group[PARENT_IDX]];

    } while (group)
    
    return true;
}

function adjustGroupIndices(groups, grpIdx, {IDX, DEPTH, IDX_POINTER, PARENT_IDX}, adjustment=1){
    for (let i=0;i<groups.length;i++){
        if (groups[i][IDX] >= grpIdx){
            groups[i][IDX] += adjustment;
            if (Math.abs(groups[i][DEPTH]) > 1){
                groups[i][IDX_POINTER] += adjustment;
            }
            let parentIdx = groups[i][PARENT_IDX];
            if (parentIdx !== null && parentIdx >= grpIdx){
                groups[i][PARENT_IDX] += adjustment;
            }
        }
    }
}

function adjustLeafIdxPointers(groups, insertionPoint, {DEPTH, IDX_POINTER}, adjustment=1){
    for (let i=0;i<groups.length;i++){
        if (Math.abs(groups[i][DEPTH]) === 1 && groups[i][IDX_POINTER] >= insertionPoint){
            groups[i][IDX_POINTER] += adjustment;
        }
    }
}

function findGroupPositions(groups, groupby, row) {

    const positions = [];

    out: for (let i = 0; i < groupby.length; i++) {
        const sorter = sortBy(groupby.slice(0, i + 1), GROUP_ROW_TEST);
        const position = sortPosition(groups, sorter, row, 'first-available');
        const group = groups[position];
        // if all groups are missing and insert position is end of list ...
        if (group === undefined) {
            break;
        }
        // position is confirmed if all groupCol values in this comparison match values of row 
        // and other groupCol values  are null
        for (let j = 0; j < groupby.length; j++) {
            const colIdx = groupby[j][0];
            const colValue = group[colIdx];
            if (j > i) {
                if (colValue !== null) {
                    break out;
                }
            } else if (colValue !== row[colIdx]) {
                break out;
            }

        }
        positions.push(position);
    }

    return positions;

}

const expandRow = (groupCols, row, meta) => {
    const r = row.slice();
    r[meta.IDX] = 0;
    r[meta.DEPTH] = 0; 
    r[meta.COUNT] = 0;
    r[meta.KEY] = buildGroupKey(groupCols, row);
    r[meta.SELECTED] = 0;
    return r;
};

function buildGroupKey(groupby, row){
    const extractKey = ([idx]) => row[idx];
    return groupby.map(extractKey).join('/');
}

// Do we have to take columnMap out again ?
function GroupRow(row, depth, idx, childIdx, parentIdx, groupby, columns, columnMap, baseGroupby = []) {

    const { IDX, RENDER_IDX, DEPTH, COUNT, KEY, SELECTED, PARENT_IDX, IDX_POINTER, count } = metaData(columns);
    const group = Array(count);
    const groupIdx = groupby.length - depth;
    let colIdx;

    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        const key = columnMap[column.name];
        if (column.aggregate) { // implies we can't group on aggregate columns, does the UI know that ?
            group[key] = 0;
        } else if ((colIdx = indexOfCol(key, groupby)) !== -1 && colIdx <= groupIdx) {
            group[key] = row[key];
        } else {
            group[key] = null;
        }
    }

    for (let i = 0; i < baseGroupby.length; i++) {
        const [colIdx] = baseGroupby[i];
        group[colIdx] = row[colIdx];
    }

    const extractKey = ([idx]) => row[idx];
    const buildKey = groupby => groupby.map(extractKey).join('/');
    //TODO build the composite key for the grouprow
    const baseKey = baseGroupby.length > 0
        ? buildKey(baseGroupby) + '/'
        : '';
    const groupKey = buildKey(groupby.slice(0, groupIdx + 1));

    group[IDX] = idx;
    group[RENDER_IDX] = 0;
    group[DEPTH] = -depth;
    group[COUNT] = 0;
    group[KEY] = baseKey + groupKey;
    group[SELECTED] = 0;
    group[IDX_POINTER] = childIdx;
    group[PARENT_IDX] = parentIdx;

    return group;

}

function groupLeafRows(sortSet, leafRows, groupby, startIdx=0, length=sortSet.length) {
    const groups = {};
    const levels = groupby.length;
    const lastLevel = levels - 1;
    for (let i=startIdx, len=startIdx+length; i < len; i++) {
        const idx = sortSet[i];
        const leafRow = leafRows[idx];
        let target = groups;
        let targetKey;
        let key;
        for (let level = 0; level < levels; level++) {
            const [colIdx] = groupby[level];
            key = leafRow[colIdx];
            targetKey = target[key];
            if (targetKey && level === lastLevel) {
                targetKey.push(idx);
            } else if (targetKey) {
                target = targetKey;
            } else if (!targetKey && level < lastLevel) {
                target = (target[key] = {});
            } else if (!targetKey) {
                target[key] = [idx];
            }
        }
    }
    return groups;
}

function splitGroupsAroundDoomedGroup(groupby, doomed) {
    const lastGroupIsDoomed = doomed === 1;
    const doomedIdx = groupby.length - doomed;
    const preDoomedGroupby = [];
    const postDoomedGroupby = [];

    groupby.forEach((col, i) => {
        if (i < doomedIdx) {
            preDoomedGroupby.push(col);
        } else if (i > doomedIdx) {
            postDoomedGroupby.push(col);
        }
    });

    return [lastGroupIsDoomed, preDoomedGroupby, postDoomedGroupby];
}

function decrementDepth(depth) {
    return (Math.abs(depth) - 1) * (depth < 0 ? -1 : 1);
}

function incrementDepth(depth) {
    return (Math.abs(depth) + 1) * (depth < 0 ? -1 : 1);
}

function findAggregatedColumns(columns, columnMap, groupby) {
    return columns.reduce((aggregations, column) => {
        if (column.aggregate && indexOfCol(column.name, groupby) === -1) {
            const key = columnMap[column.name];
            aggregations.push([key, column.aggregate]);
        }
        return aggregations;
    }, []);
}

function aggregateGroup(groups, grpIdx, sortSet, rows, columns, aggregations) {

    const {DEPTH, COUNT} = metaData(columns);
    const groupRow = groups[grpIdx];
    let depth = groupRow[DEPTH];
    let absDepth = Math.abs(depth);
    let count = 0;
    let idx = grpIdx;

    // find the last nested group and work back - first build aggregates for level 1 groups,
    // then use those to aggregate to level 2 etc.
    while (idx < groups.length - 1 && Math.abs(groups[idx+1][DEPTH]) < absDepth){
        idx += 1;
        count += 1;
    }

    for (let i=grpIdx+count; i >= grpIdx; i--){
        for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
            const [colIdx] = aggregations[aggIdx];
            groups[i][colIdx] = 0;
        }
        aggregate(groups[i], groups, sortSet, rows, columns, aggregations, groups[i][COUNT]);
    }

}

function aggregate(groupRow, groupRows, sortSet, rows, columns, aggregations, leafCount, filter=null) {

    const {DEPTH, COUNT, FILTER_COUNT} = metaData(columns);
    const { IDX_POINTER } = metaData(columns);
    let absDepth = Math.abs(groupRow[DEPTH]);
    let count = 0;
    let filteredCount = filter === null ? undefined : 0;

    if (absDepth === 1) {
        // The first group accumulates aggregates from the raw data...
        let start = groupRow[IDX_POINTER];
        let end = start + leafCount;
        count = leafCount;
        for (let i = start; i < end; i++) {
            const row = rows[sortSet[i]];
            const included = filter === null || filter(row);
            if (filter && included){
                filteredCount += 1;
            }
            if (filter === null || included){
                for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
                    const [colIdx] = aggregations[aggIdx];
                    groupRow[colIdx] += row[colIdx];
                }
            }
        }
    } else {
        // higher-level groups aggregate from child-groups ...
        // we cannot blindly use the grpIndex of the groupRow, as we may be dealing with a smaller subset
        // of groupRows, e,g, when inserting a new row and creating the missing groups
        const startIdx = groupRows.indexOf(groupRow) + 1;
        for (let i=startIdx;i<groupRows.length;i++){
            const nestedGroupRow = groupRows[i];
            const nestedRowDepth = nestedGroupRow[DEPTH];
            const nestedRowCount = nestedGroupRow[COUNT];
            const absNestedRowDepth = Math.abs(nestedRowDepth);
            if (absNestedRowDepth >= absDepth){
                break;
            } else if (absNestedRowDepth === absDepth - 1) {
                for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
                    const [colIdx, method] = aggregations[aggIdx];
                    if (method === 'avg') {
                        groupRow[colIdx] += nestedGroupRow[colIdx] * nestedRowCount;
                    } else {
                        groupRow[colIdx] += nestedGroupRow[colIdx];
                    }
                }
                count += nestedRowCount;
            }
        }
    }

    for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
        const [colIdx, method] = aggregations[aggIdx];
        if (method === 'avg') {
            groupRow[colIdx] = groupRow[colIdx] / count;
        }
    }

    groupRow[COUNT] = count;
    groupRow[FILTER_COUNT] = filteredCount;

}

function isEmptyRow(row){
    return row[0] === undefined;
}

function addRowsToIndex(rows, index, indexField){
    for (let idx = 0, len=rows.length; idx < len; idx++) {
        index[rows[idx][indexField]] = idx;
    }
    return index;
}

function update(rows, updates, {IDX}) {
    const results = rows.slice();

    for (let i = 0; i < updates.length; i++) {
        const [idx, ...fieldUpdates] = updates[i];
        // slow, refactor for performance

        let row;
        for (let ii = 0; ii < rows.length; ii++) {
            if (rows[ii][IDX] === idx) {
                row = rows[ii].slice();
                for (let j = 0; j < fieldUpdates.length; j += 2) {
                    row[fieldUpdates[j]] = fieldUpdates[j + 1];
                }
                results[ii] = row;

                break;

            }
        }
    }

    return results;
}

const MAX_LISTENERS = 10;

class EventEmitter {

    constructor() {
        this._events = {};
        this._maxListeners = MAX_LISTENERS;
    }

    addListener(type, listener) {
        let m;

        if (!isFunction(listener)) {
            throw TypeError('listener must be a function');
        }

        if (!this._events) {
            this._events = {};
        }

        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (this._events.newListener) {
            this.emit('newListener', type, listener);
        }

        if (!this._events[type]) {
            // Optimize the case of one listener. Don't need the extra array object.
            this._events[type] = listener;
        } else if (Array.isArray(this._events[type])) {
            // If we've already got an array, just append.
            this._events[type].push(listener);
        } else {
            // Adding the second element, need to change to array.
            this._events[type] = [this._events[type], listener];
        }

        // Check for listener leak
        if (Array.isArray(this._events[type]) && !this._events[type].warned) {
            if (!isUndefined(this._maxListeners)) {
                m = this._maxListeners;
            } else {
                m = MAX_LISTENERS;
            }

            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
                console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                this._events[type].length);
            }
        }

        return this;

    }

    removeListener(type, listener) {
        let list, position, length, i;

        if (!isFunction(listener)) {
            throw TypeError('listener must be a function');
        }

        if (!this._events || !this._events[type]) {
            return this;
        }

        list = this._events[type];
        length = list.length;
        position = -1;

        if (list === listener ||
            (isFunction(list.listener) && list.listener === listener)) {
            delete this._events[type];
            if (this._events.removeListener) {
                this.emit('removeListener', type, listener);
            }

        } else if (Array.isArray(list)) {
            for (i = length; i-- > 0;) {
                if (list[i] === listener ||
                    (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }

            if (position < 0) {
                return this;
            }

            if (list.length === 1) {
                list.length = 0;
                delete this._events[type];
            } else {
                list.splice(position, 1);
            }

            if (this._events.removeListener) {
                this.emit('removeListener', type, listener);
            }
        }

        return this;

    }

    removeAllListeners(type) {

        if (!this._events) {
            return this;
        }

        const listeners = this._events[type];

        if (isFunction(listeners)) {
            this.removeListener(type, listeners);
        } else if (listeners) {
            // LIFO order
            while (listeners.length) {
                this.removeListener(type, listeners[listeners.length - 1]);
            }
        }
        delete this._events[type];

        return this;

    }

    emit(type, ...args) {

        if (!this._events) {
            this._events = {};
        }

        // If there is no 'error' event listener then throw.
        if (type === 'error') {
            if (!this._events.error ||
                (isObject(this._events.error) && !this._events.error.length)) {
                const err = arguments[1];
                if (err instanceof Error) {
                    throw err; // Unhandled 'error' event
                } else {
                    // At least give some kind of context to the user
                    throw new Error('Uncaught, unspecified "error" event. (' + err + ')');
                }
            }
        }

        const handler = this._events[type];

        if (isUndefined(handler)) {
            return false;
        }

        if (isFunction(handler)) {
            switch (args.length) {
                // fast cases
                case 0:
                    handler.call(this);
                    break;
                case 1:
                    handler.call(this, type, args[0]);
                    break;
                case 2:
                    handler.call(this, type, args[0], args[1]);
                    break;
                // slower
                default:
                    handler.call(this, type, ...args);
            }
        } else if (Array.isArray(handler)) {
            handler.slice().forEach(listener => listener.call(this, type, ...args));
        }

        return true;

    }

    once(type, listener) {

        const handler = (evtName, message) => {
            this.removeListener(evtName, handler);
            listener(evtName, message);
        };

        this.on(type, handler);

    }

    on(type, listener) {
        return this.addListener(type, listener);
    }

}

function isFunction(arg) {
    return typeof arg === 'function';
}

function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
    return arg === void 0;
}

const logColor = {
  plain : 'color: black; font-weight: normal',
  blue : 'color: blue; font-weight: bold',
  brown : 'color: brown; font-weight: bold',
  green : 'color: green; font-weight: bold',
};

const {plain} = logColor;
const createLogger = (source, labelColor=plain, msgColor=plain) => ({
  log: (msg, args='') => console.log(`[${Date.now()}]%c[${source}] %c${msg}`,labelColor, msgColor, args),
  warn: (msg) => console.warn(`[${source}] ${msg}`)
});

/*global fetch */

const defaultUpdateConfig = {
    applyUpdates: false,
    applyInserts: false,
    interval: 500
};

class Table extends EventEmitter {

    constructor(config){
        super();

        const {name, columns=null, primaryKey, dataPath, data, updates = {}} = config;

        this.name = name;
        this.primaryKey = primaryKey;
        this.columns = columns;
        this.keys = {};
        this.index = {};
        this.rows = [];
        this.updateConfig = {
            ...defaultUpdateConfig,
            ...updates
        };
        this.columnMap = buildColumnMap(columns);
        this.columnCount = 0;
        this.status = null;

        // console.log(`Table 
        //     columns = ${JSON.stringify(columns,null,2)}
        //     columnMap = ${JSON.stringify(this.columnMap,null,2)}    
        //     `)


        if (data){
            this.parseData(data);
        } else if (dataPath){
            this.loadData(dataPath);
        }

        this.installDataGenerators(config);
    }

    // ...updates = one or more pairs of (colIdx, colValue)
    update(rowIdx, ...updates){
        //onsole.log(`Table.update ${this.name} idx: ${rowIdx}  ${JSON.stringify(updates)}` );
        const results = [];
        let row = this.rows[rowIdx];
        for (let i=0;i<updates.length;i+=2){
            const colIdx = updates[i];
            const value = updates[i+1];
            results.push(colIdx, row[colIdx], value);
            row[colIdx] = value;
        }
        this.emit('rowUpdated', rowIdx, results);
    }

    insert(data){
        let columnnameList = this.columns ? this.columns.map(c => c.name): null;
        const idx = this.rows.length;
        let row = this.rowFromData(idx, data, columnnameList);
        this.rows.push(row);
        this.emit('rowInserted', idx, row);
    }

    remove(key){
        if (this.keys[key]){
            const index = this.indices[key];
            delete this.keys[key];
            delete this.indices[key];
            this.rows.splice(index,1);

            for (let k in this.indices){
                if (this.indices[k] > index){
                    this.indices[k] -= 1;
                }
            }

            this.emit('rowRemoved', this.name, key);

        }
    }

    clear(){

    }

    toString(){
        const out = ['\n' + this.name];
        out.splice.apply(out, [1,0].concat(this.rows.map(function(row){return row.toString();})));
        return out.join('\n');
    }

    async loadData(url){
        fetch(url,{

        })
            .then(data => data.json())
            .then(json => {
                console.log(`Table.loadData: got ${json.length} rows`);
                this.parseData(json);
            })
            .catch(err => {
                console.error(err);
            });

    }

    parseData(data){
        let columnnameList = this.columns ? this.columns.map(c => c.name): null;
        const rows = [];
        for (let i=0;i<data.length;i++){
            let row = this.rowFromData(i, data[i], columnnameList);
            rows.push(row);
        }
        this.rows = rows;

        if (this.columns === null){
            this.columns = columnsFromColumnMap(this.inputColumnMap);
            this.columnMap = buildColumnMap(this.columns);
        }
        this.status = 'ready';
        this.emit('ready');
        if (this.updateConfig && this.updateConfig.applyUpdates !== false){
            setTimeout(() => {
                this.applyUpdates();
            },1000);
        }
        // move this
        if (this.updateConfig && this.updateConfig.applyInserts !== false){
            setTimeout(() => {
                this.applyInserts();
            },10000);
        }
    }

    rowFromData(idx, data, columnnameList){
        // 2 metadata items for each row, the idx and unique key
        const {index, primaryKey=null, columnMap: map} = this;

        if (Array.isArray(data)){
            const key = data[map[this.primaryKey]];
            index[key] = idx;
            return [...data, idx, key];
        } else {
            // This allows us to load data from objects as rows, without predefined columns, where
            // not every row may have every column. How would we handle primary key ?
            const columnMap = map || (this.columnMap = {});
            const colnames = columnnameList || Object.getOwnPropertyNames(data);
            const row = [idx];
            let colIdx;
            let key;

            for (let i=0; i<colnames.length; i++){
                const name = colnames[i];
                const value = data[name];
                if ((colIdx = columnMap[name]) === undefined){
                    colIdx = columnMap[name] = this.columnCount++;
                }
                row[colIdx] = value;
                // If we don't know the primary key, assume it is the first column for now
                if ((name === primaryKey) || (primaryKey === null && i === 0)){
                    key = value;
                    index[value] = idx;
                }
            }
            // doesn't this risk pushing the metadata into the wrong slots if not every row has every 
            // field
            row.push(idx, key);
            return row;
        }
    }

    //TODO move all these methods into an external helper
    applyInserts(){

        const idx = this.rows.length;
        const newRow = this.createRow(idx);
        if (newRow){
            this.insert(newRow);
        } else {
            console.log(`createRow did not return a new row`);
        }

        setTimeout(() => this.applyInserts(),this.updateConfig.insertInterval | 100);

    }

    applyUpdates(){
        const {rows} = this;
        // const count = Math.round(rows.length / 50);
        const count = 100;

        for (let i=0; i<count; i++){
            const rowIdx = getRandomInt(rows.length - 1);
            const update = this.updateRow(rowIdx, this.rows[rowIdx], this.columnMap);
            if (update){
                this.update(rowIdx, ...update);
            }
        }

        setTimeout(() => this.applyUpdates(),this.updateConfig.interval);

    }

    createRow(idx){
        console.warn(`createRow ${idx} must be implemented as a plugin`);
    }

    updateRow(/*idx, row, columnMap*/){
        return null;
    }

    async installDataGenerators(/*config*/){
        //console.warn(`installDataGenerators must be implemented by a more specific subclass`);
    }

}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function columnsFromColumnMap(columnMap){

    const columnNames = Object.getOwnPropertyNames(columnMap);

    return columnNames
        .map(name => ({name, key: columnMap[name]}))
        .sort(byKey$1)
        .map(({name}) => ({name}));

}

function byKey$1(col1, col2){
    return col1.key - col2.key;
}

const CHECKBOX = 'checkbox';
const SINGLE_ROW = 'single-row';
const MULTIPLE_ROW = 'multiple-row';

const SelectionModelType = {
  Checkbox: CHECKBOX,
  SingleRow: SINGLE_ROW,
  MultipleRow: MULTIPLE_ROW
};

const {Checkbox, SingleRow, MultipleRow} = SelectionModelType;

const EMPTY$1 = [];

class SelectionModel {

    constructor(selectionModelType=MultipleRow){
      this.modelType = selectionModelType;
    }

    select({rows:selection, lastTouchIdx}, idx, rangeSelect, keepExistingSelection){
        
        let selected, deselected;

        if (this.modelType === SingleRow){
            [selection, selected, deselected] = this.handleRegularSelection(selection, idx);
            lastTouchIdx = idx;
        } else if (rangeSelect){
            [selection, selected, deselected] = this.handleRangeSelection(selection, lastTouchIdx, idx);
        } else if (keepExistingSelection || this.modelType === Checkbox){
            [selection, selected, deselected] = this.handleIncrementalSelection(selection, idx);
            lastTouchIdx = idx;
        } else {
            [selection, selected, deselected] = this.handleRegularSelection(selection, idx);
            lastTouchIdx = idx;
        }

        return {
          focusedIdx: idx,
          lastTouchIdx,
          rows: selection,
          selected,
          deselected
        };

    }

    handleRegularSelection(selected, idx){
        const pos = selected.indexOf(idx);
        if (pos === -1){
            const selection = [idx];
            return [selection, selection, selected];
        } else if (selected.length === 1){
            return [EMPTY$1, EMPTY$1, selected];
        } else {
          return [EMPTY$1, EMPTY$1, remove(selected,idx)];
        }
    }

    handleIncrementalSelection(selected, idx){
        const pos = selected.indexOf(idx);
        const len = selected.length;
        const selection = [idx];

        if (pos === -1){
          if (len === 0){
              return [selection, selection,EMPTY$1];
            } else {
                return [insert(selected,idx), selection, EMPTY$1];
            }
        } else {
            if (len === 1){
                return [EMPTY$1, EMPTY$1, selected];
            } else {
                return [remove(selected,idx), EMPTY$1, selection];
            }
        }		
    }

    handleRangeSelection(selected, lastTouchIdx, idx){

        const pos = selected.indexOf(idx);
        const len = selected.length;

        if (pos === -1){

            if (len === 0){
                const selection = makeRange(0,idx);
                return [selection, selection, EMPTY$1];
            } else if (len === 1){
                const selection = makeRange(selected[0],idx);
                selected = selected[0] < idx
                  ? selection.slice(1)
                  : selection.slice(0,-1);
                return [selection, selected, EMPTY$1];
            } else {
                const selection = applyRange(selected,lastTouchIdx,idx);
                return [selection, selection.filter(i => !selected.includes(i)), EMPTY$1];
            }
        }
    }

}
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

/**
 * Keep all except for groupRowset in this file to avoid circular reference warnings
 */

const SINGLE_COLUMN = 1;

const NO_OPTIONS = {
    filter: null
};

class BaseRowSet {

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
        this.selectionModel = new SelectionModel();
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
        console.log(`RowSet.select ${idx} rangeSelect:${rangeSelect}, keepExistingSelection: ${keepExistingSelection}`);
        
        const {selected, deselected, ...selectionState} = this.selectionModel.select(
            this.selected,
            idx,
            rangeSelect,
            keepExistingSelection
        );
        
        this.selected = selectionState;

        return {selected, deselected};
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
        const data = bin().thresholds(20)(numbers).map((arr, i) => [i + 1, arr.length, arr.x0, arr.x1]);

        const table = new Table({ data, primaryKey: 'bin', columns: BIN_FILTER_DATA_COLUMNS });
        const filterRowset = new BinFilterRowSet(table, BIN_FILTER_DATA_COLUMNS, column.name);
        return filterRowset;
    }

    getDistinctValuesForColumn(column) {
        const { data: rows, columnMap, currentFilter } = this;
        const colIdx = columnMap[column.name];
        const resultMap = {};
        const data = [];
        const dataRowCount = rows.length;
        const [/*columnFilter*/, otherFilters] = splitFilterOnColumn(currentFilter, column);
        // this filter for column that we remove will provide our selected values   
        let dataRowAllFilters = 0;

        if (otherFilters === null) {
            let result;
            for (let i = 0; i < dataRowCount; i++) {
                const val = rows[i][colIdx];
                if (result = resultMap[val]) {
                    result[2] = ++result[1];
                } else {
                    result = [val, 1, 1];
                    resultMap[val] = result;
                    data.push(result);
                }
            }
            dataRowAllFilters = dataRowCount;
        } else {

            const fn = functor(columnMap, otherFilters);
            let result;

            for (let i = 0; i < dataRowCount; i++) {
                const row = rows[i];
                const val = row[colIdx];
                const isIncluded = fn(row) ? 1 : 0;
                if (result = resultMap[val]) {
                    result[1] += isIncluded;
                    result[2]++;
                } else {
                    result = [val, isIncluded, 1];
                    resultMap[val] = result;
                    data.push(result);
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
class RowSet extends BaseRowSet {

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
        const {selectedSet} = this;
        if (this.filterSet) {
            const filteredData = this.filterSet.slice(lo, hi);
            const filterMapper = typeof filteredData[0] === 'number'
                ? idx => this.data[idx]
                : ([idx]) => this.data[idx];
            return filteredData
                .map(filterMapper)
                .map(this.project(lo + this.offset, selectedSet));
        } else if (this.sortCols) {
            const sortSet = this.sortSet;
            const results = [];
            for (let i = lo, rows = this.data, len = rows.length; i < len && i < hi; i++) {
                const idx = this.sortReverse
                    ? sortSet[len - i - 1][0]
                    : sortSet[i][0];
                const row = rows[idx];
                results.push(row);
            }
            return results.map(this.project(lo + this.offset, selectedSet));
        } else {
            return this.data.slice(lo, hi).map(this.project(lo + this.offset, selectedSet));
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
            sortExtend(sortSet, this.data, this.sortCols, sortCols, this.columnMap);
        } else {
            this.sortReverse = false;
            sort(sortSet, this.data, sortCols, this.columnMap);
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
        const fn = filter && functor(this.columnMap, filter);
        const { data: rows } = this;
        let [navSet] = this.selectNavigationSet(extendsCurrentFilter && this.filterSet);
        const newFilterSet = [];

        for (let i = 0; i < navSet.length; i++) {
            const rowIdx = navSet === this.filterSet ? navSet[i] : navSet[i][0];
            const row = rows[rowIdx];
            if (fn(row)) {
                newFilterSet.push(rowIdx);
            }

        }
        this.filterSet = newFilterSet;
        this.currentFilter = filter;
        if (!extendsCurrentFilter && this.sortRequired) {
            // TODO this might be very expensive for large dataset
            // WHEN DO WE DO THIS - IS THIS CORRECT !!!!!
            this.sort(this.sortCols);
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
            const fn = functor(this.columnMap, this.currentFilter);
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
            const fn = functor(this.columnMap, this.currentFilter);
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
class SetFilterRowSet extends RowSet {
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
        this.setProjection();
        this.sort([['name', 'asc']]);
    }

    get searchText() {
        return this._searchText;
    }

    set searchText(text) {
        // TODO
        console.log(`FilterRowset set text = '${text}'`);
        this.selectedCount = this.filter({ type: 'SW', colName: 'name', value: text });
        const {filterSet, data: rows} = this;
        // let totalCount = 0;
        const colIdx = this.columnMap.totalCount;
        for (let i=0;i<filterSet.length;i++){
            const row = rows[filterSet[i]];
            // totalCount += row[colIdx];
        }
        // this.totalCount = totalCount;
        this._searchText = text;
    }


    currentRange(){
        //TODO move these into a single struct

            return {
                ...super.currentRange(),
                //TODO is this necessary, these won't change on a range request
                dataCounts: this.dataCounts
            }
    
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
            const fn = functor(columnMap, overrideColName(columnFilter, 'name'));
            dataCounts.filterRowSelected = filterSet.reduce((count, i) => count + (fn(rows[i]) ? 1 : 0),0); 
                
        } else {
            dataCounts.filterRowSelected = filterSet.length;
        }

        dataCounts.filterRowTotal = filterSet.length;
    }

    clearFilter() {
        this.currentFilter = null;
        this.filterSet = null;
        this._searchText = '';
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
            const fn = functor(columnMap, overrideColName(columnFilter, 'name'));
            dataCounts.filterRowSelected = filterSet
                ? filterSet.reduce((count, i) => count + (fn(rows[i]) ? 1 : 0),0) 
                : rows.reduce((count, row) => count + (fn(row) ? 1 : 0),0); 
        } else {
            dataCounts.filterRowSelected = filterSet
                ? filterSet.length
                : rows.length;
        }

        dataCounts.dataRowAllFilters = dataRowAllFilters;

        this.setProjection(columnFilter);

        console.log(`SetFilterRowSet.setSelected selectedCount ${dataCounts.filterRowSelected} current range ${JSON.stringify(this.range)}`);
        return this.currentRange();

    }

    setProjection(columnFilter = null){

        const columnMap = this.table.columnMap;

        this.project = projectColumnsFilter(
            columnMap,
            this.columns,
            this.meta,
            columnFilter
        );

    }

}

class BinFilterRowSet extends RowSet {
    constructor(table, columns, columnName) {
        super(table, columns);
        this.type = DataTypes.FILTER_BINS;
        this.columnName = columnName;
    }

    setSelected(filter){
        console.log(`need to apply filter to selected BinRowset`, filter);
    }
    // we don't currently have a concept of range here, but it will
    // be used in the future
    // Note: currently no projection here, we don't currently need metadata
    setRange() {
        console.log(`BinFilterRowset.setRange`);
        return {
            type: this.type,
            rows: this.data,
            range: null,
            size: this.size,
            offset: 0
        };
    }

}

const RANGE_POS_TUPLE_SIZE = 4;
const NO_RESULT = [null,null,null];

const FORWARDS = 0;
const BACKWARDS = 1;
function GroupIterator(groups, navSet, data, NAV_IDX, NAV_COUNT, meta) {
    let _idx = 0;
    let _grpIdx = null;
    let _rowIdx = null;
    let _direction = FORWARDS;
    let _range = NULL_RANGE;
    let _range_position_lo = [0, null, null];
    let _range_positions = [];
    let _range_position_hi = [null, null, null];

    return {
        get direction(){ return _direction },
        get rangePositions(){ return _range_positions },
        setRange,
        currentRange,
        getRangeIndexOfGroup,
        getRangeIndexOfRow,
        setNavSet,
        refresh: currentRange,
        clear
    };


    function getRangeIndexOfGroup(grpIdx){
        const list = _range_positions;
        for (let i=0; i< list.length; i += RANGE_POS_TUPLE_SIZE){
            if (list[i+1] === grpIdx) {
                if (list[i+2] === null){
                    return i/RANGE_POS_TUPLE_SIZE;
                } else {
                    // first row encountere should be the group, if it
                    // isn't it means it is crolled out of viewport
                    return -1;
                }
            }
        }
        return -1;
    }

    function getRangeIndexOfRow(idx){
        const list = _range_positions;
        for (let i=0; i< list.length; i += RANGE_POS_TUPLE_SIZE){
            if (list[i+3] === idx) {
                return i/RANGE_POS_TUPLE_SIZE;
            }
        }
        return -1
    }

    function clear(){
        _idx = 0;
        _grpIdx = null;
        _rowIdx = null;
        _direction = FORWARDS;
        _range = NULL_RANGE;
        _range_position_lo = [0, null, null];
        _range_positions = [];
        _range_position_hi = [null, null, null];
    }

    function setNavSet([newNavSet, navIdx, navCount]){
        navSet = newNavSet;
        NAV_IDX = navIdx;
        NAV_COUNT = navCount;
    }

    function currentRange(){
        const rows = [];
        const {IDX} = meta;
        ([_idx, _grpIdx, _rowIdx] = _range_position_lo);
        if (_idx === 0 && _grpIdx === null && _rowIdx === null){
            _idx = -1;
        }
        _range_positions.length = 0;

        let startIdx = _idx;
        let row;
        let i = _range.lo;
        do {
            _direction = FORWARDS;
            ([row, _grpIdx, _rowIdx] = next(groups, data, _grpIdx, _rowIdx, navSet, NAV_IDX, NAV_COUNT, meta));
            if (row){
                rows.push(row);
                _idx += 1;
                const absRowIdx = _rowIdx === null ? null : row[IDX];
                _range_positions.push(_idx, _grpIdx, _rowIdx, absRowIdx);
                i += 1;
            }
        } while (row && i < _range.hi)
        if (row){
            _direction = FORWARDS;
            const [grpIdx, rowIdx] = [_grpIdx, _rowIdx];
            [row, _grpIdx, _rowIdx] = next(groups, data, _grpIdx, _rowIdx, navSet, NAV_IDX, NAV_COUNT, meta);
            _idx += 1;
            _range_position_hi = [row ? _idx : null, _grpIdx, _rowIdx];
            ([_grpIdx, _rowIdx] = [grpIdx, rowIdx]);
        } else {
            _range_position_hi = [null,null,null];
        }

        return [rows, startIdx+1];

    }

    function setRange(range, useDelta=true){
        const rangeDiff = compareRanges(_range, range);
        const { lo: resultLo, hi: resultHi } = useDelta ? getDeltaRange(_range, range) : getFullRange(range);
        const {IDX} = meta;

        if (rangeDiff === RangeFlags.NULL){
            _range_position_lo = [0,null,null];
            _range_position_hi = [null,null,null];
            _range_positions.length = 0;
            return [[],null];
        } else if (range.lo === _range.lo && useDelta === false){
            // when we're asked for the same range again, rebuild the range
            ([_idx, _grpIdx, _rowIdx] = _range_position_lo);
            _range_positions.length = 0;
        } else {

            if (_direction === FORWARDS && (rangeDiff & RangeFlags.BWD)){
                ([_idx, _grpIdx, _rowIdx] = _range_positions);
            } else if (_direction === BACKWARDS && (rangeDiff & RangeFlags.FWD)){
                ([_idx, _grpIdx, _rowIdx] = _range_positions.slice(-RANGE_POS_TUPLE_SIZE));
                _idx += 1;
            }

            if (rangeDiff === RangeFlags.FWD){
                skip(range.lo - _range.hi, next);
                _range_positions.length = 0;
            } else if (rangeDiff === RangeFlags.BWD){
                skip(_range.lo - range.hi, previous);
                _range_positions.length = 0;
            }

            const loDiff = range.lo - _range.lo;
            const hiDiff = _range.hi - range.hi;
            // allow for a range that overshoots data
            const missingQuota = (_range.hi - _range.lo) - _range_positions.length/RANGE_POS_TUPLE_SIZE;

            if (loDiff > 0){
                const removed = _range_positions.splice(0,loDiff*RANGE_POS_TUPLE_SIZE);
                if (removed.length){
                    _range_position_lo = removed.slice(-RANGE_POS_TUPLE_SIZE);

                    // experiment - is this A) always correct B) enough
                    if (useDelta === false){
                        [_idx, _grpIdx, _rowIdx] = _range_position_lo;
                    }

                }
            }
            if (hiDiff > 0){
                //TODO allow for scenatio where both lo and HI have changed
                if (hiDiff > missingQuota){
                    const absDiff = hiDiff - missingQuota;
                    const removed = _range_positions.splice(-absDiff*RANGE_POS_TUPLE_SIZE,absDiff*RANGE_POS_TUPLE_SIZE);
                    if (removed.length){
                        _range_position_hi = removed.slice(0,RANGE_POS_TUPLE_SIZE);
                    }
                }
            }

        }

        const rows = [];
        let row;
        let startIdx = null;

        if ((rangeDiff & RangeFlags.REDUCE) === 0){
            if ((rangeDiff & RangeFlags.FWD) || (rangeDiff === RangeFlags.SAME)){
                let i = resultLo;
                startIdx = _idx;
                do {
                    _direction = FORWARDS;
                    ([row, _grpIdx, _rowIdx] = next(groups, data, _grpIdx, _rowIdx, navSet, NAV_IDX, NAV_COUNT, meta));
                    if (row){
                        rows.push(row);
                        const absRowIdx = _rowIdx === null ? null : row[IDX];
                        _range_positions.push(_idx, _grpIdx, _rowIdx, absRowIdx);
                        i += 1;
                        _idx += 1;
                    }
                } while (row && i < resultHi)
                if (row){
                    _direction = FORWARDS;
                    const [grpIdx, rowIdx] = [_grpIdx, _rowIdx];
                    ([row, _grpIdx, _rowIdx] = next(groups, data ,_grpIdx, _rowIdx, navSet, NAV_IDX, NAV_COUNT, meta));
                    _range_position_hi = [row ? _idx : null, _grpIdx, _rowIdx];
                    ([_grpIdx, _rowIdx] = [grpIdx, rowIdx]);
                } else {
                    _range_position_hi = [null,null,null];
                }

            } else {
                let i = resultHi - 1;
                do {
                    _direction = BACKWARDS;
                    ([row, _grpIdx, _rowIdx] = previous(groups, data, _grpIdx, _rowIdx, navSet, NAV_IDX, NAV_COUNT, meta));
                    if (row){
                        _idx -= 1;
                        rows.unshift(row);
                        const absRowIdx = _rowIdx === null ? null : row[IDX];
                        _range_positions.unshift(_idx, _grpIdx, _rowIdx, absRowIdx);
                        i -= 1;
                    }
                } while (row && i >= resultLo)
                startIdx = _idx;
                if (row){
                    const [grpIdx, rowIdx] = [_grpIdx, _rowIdx];
                    _direction = BACKWARDS;
                    [row, _grpIdx, _rowIdx] = previous(groups, data, _grpIdx, _rowIdx, navSet, NAV_IDX, NAV_COUNT, meta);
                    _range_position_lo = [row ? _idx-1 : 0, _grpIdx, _rowIdx];
                    ([_grpIdx, _rowIdx] = [grpIdx, rowIdx]);
                } else {
                    _range_position_lo = [0,null,null];
                }

            }

        } else {
            // reduced range, adjust the current pos. DIrection can only be a guess, but if it's wrong
            // the appropriate adjustment will be made nest time range is set
            if (rangeDiff & RangeFlags.FWD){
                console.log(`adjust thye idx`);
                ([_idx, _grpIdx, _rowIdx] = _range_positions.slice(-RANGE_POS_TUPLE_SIZE));
                _idx += 1;
            } else {
                ([_idx, _grpIdx, _rowIdx] = _range_positions);
            }
        }

        _range = range;
        return [rows, startIdx];
    }

    function skip(n, fn){

        let i=0;
        let row;

        do {
            [row, _grpIdx, _rowIdx] = fn(groups, data, _grpIdx, _rowIdx, navSet, NAV_IDX, NAV_COUNT, meta);
            if (fn === next){
                _idx += 1;
            } else {
                _idx -= 1;
            }
            i += 1;

        } while (row && i < n)
        if (fn === next){
            _range_position_lo = [_idx-1, _grpIdx, _rowIdx];
        } else {
            _range_position_hi = [_idx, _grpIdx, _rowIdx];
        }
    }

}

function getAbsRowIdx(group, relRowIdx, navSet, NAV_IDX){
    return navSet[group[NAV_IDX] + relRowIdx];
}

function next(groups, rows, grpIdx, rowIdx, navSet, NAV_IDX, NAV_COUNT, meta){
    if (grpIdx === null){
        grpIdx = -1;
        do {
            grpIdx += 1;
        } while (grpIdx < groups.length && (
            (getCount(groups[grpIdx],NAV_COUNT) === 0)
        ));

        if (grpIdx >= groups.length){
            return NO_RESULT;
        } else {
            return [groups[grpIdx], grpIdx, null];
        }
    } else if (grpIdx >= groups.length){
        return NO_RESULT;
    } else {
        let groupRow = groups[grpIdx];
        const depth = groupRow[meta.DEPTH];
        const count = getCount(groupRow,NAV_COUNT);
        // Note: we're unlikely to be passed the row if row count is zero
        if (depth === 1 && count !== 0 && (rowIdx === null || rowIdx < count - 1)){
            rowIdx = rowIdx === null ? 0 : rowIdx + 1;
            const absRowIdx = getAbsRowIdx(groupRow, rowIdx, navSet, NAV_IDX);
            // the equivalent of project row
            const row = rows[absRowIdx].slice();
            row[meta.IDX] = absRowIdx;
            row[meta.RENDER_IDX] = 0;            row[meta.DEPTH] = 0;
            row[meta.COUNT] = 0;
            row[meta.KEY] = row[0]; // assume keyfieldis 0 for now
            return [row, grpIdx, rowIdx === null ? 0 : rowIdx];
        } else if (depth > 0){

            do {
                grpIdx += 1;
            } while (grpIdx < groups.length && (
                (getCount(groups[grpIdx],NAV_COUNT) === 0)
            ));
            if (grpIdx >= groups.length){
                return NO_RESULT;
            } else {
                return [groups[grpIdx], grpIdx, null];
            }
        } else {
            const absDepth = Math.abs(depth);
            do {
                grpIdx += 1;
            } while (grpIdx < groups.length && (
                (Math.abs(groups[grpIdx][meta.DEPTH]) < absDepth) ||
                (getCount(groups[grpIdx],NAV_COUNT) === 0)
            ));
            if (grpIdx >= groups.length){
                return NO_RESULT;
            } else {
                return [groups[grpIdx], grpIdx, null];
            }
        }
    }
}

function previous(groups, data, grpIdx, rowIdx, navSet, NAV_IDX, NAV_COUNT, meta){
    if (grpIdx !== null && groups[grpIdx][meta.DEPTH] === 1 && typeof rowIdx === 'number'){
        let lastGroup = groups[grpIdx];
        if (rowIdx === 0){
            return [lastGroup, grpIdx, null];
        } else {
            rowIdx -= 1;
            const absRowIdx = getAbsRowIdx(lastGroup, rowIdx, navSet, NAV_IDX);
            const row = data[absRowIdx].slice();
            // row[meta.IDX] = idx;
            row[meta.RENDER_IDX] = 0; // is this right ?
            row[meta.DEPTH] = 0;
            row[meta.COUNT] = 0;
            row[meta.KEY] = row[0]; // assume keyfieldis 0 for now

            return [row, grpIdx, rowIdx];
        }
    } else {
        if (grpIdx === null){
            grpIdx = groups.length-1;
        } else if (grpIdx === 0) {
            return NO_RESULT;
        } else {
            grpIdx -= 1;
        }
        let lastGroup = groups[grpIdx];
        if (lastGroup[meta.DEPTH] === 1){
            rowIdx = getCount(lastGroup, NAV_COUNT) - 1;
            const absRowIdx = getAbsRowIdx(lastGroup, rowIdx, navSet, NAV_IDX);
            const row = data[absRowIdx].slice();
            row[meta.RENDER_IDX] = 0; // is tis right ?
            row[meta.DEPTH] = 0;
            row[meta.COUNT] = 0;
            row[meta.KEY] = row[0]; // assume keyfieldis 0 for now

            return [row, grpIdx, rowIdx];
        }
        while (lastGroup[meta.PARENT_IDX] !== null && groups[lastGroup[meta.PARENT_IDX]][meta.DEPTH] < 0){
            grpIdx = lastGroup[meta.PARENT_IDX];
            lastGroup = groups[grpIdx];
        }
        return [lastGroup, grpIdx, null];
    }
}

const EMPTY_ARRAY = [];

class GroupRowSet extends BaseRowSet {

    constructor(rowSet, columns, groupby, groupState, sortCriteria = null, filter=rowSet.currentFilter) {
        super(rowSet.table, columns, rowSet.baseOffset);
        this.groupby = groupby;
        this.groupState = groupState;
        this.aggregations = [];
        this.currentLength = 0; // TODO
        this.groupRows = [];
        this.aggregatedColumn = {};

        this.collapseChildGroups = this.collapseChildGroups.bind(this);
        this.countChildGroups = this.countChildGroups.bind(this);

        columns.forEach(column => {
            if (column.aggregate) {
                const key = rowSet.columnMap[column.name];
                this.aggregations.push([key, column.aggregate]); // why ?
                this.aggregatedColumn[key] = column.aggregate;
            }
        });
        this.expandedByDefault = false;
        this.sortCriteria = Array.isArray(sortCriteria) && sortCriteria.length
            ? sortCriteria
            : null;

        // can we lazily build the sortSet as we fetch data for the first time ?
        this.sortSet = rowSet.data.map((d,i) => i);
        // we will store an array of pointers to parent Groups.mirroring sequence of leaf rows
        this.rowParents = Array(rowSet.data.length);

        this.applyGroupby(groupby);


        const [navSet, IDX, COUNT] = this.selectNavigationSet(false);
        // TODO roll the IDX and COUNT overrides into meta
        this.iter = GroupIterator(this.groupRows, navSet, this.data, IDX, COUNT, this.meta);

        if (filter){
            this.filter(filter);
        }

    }

    get length() {
        return this.currentLength;
    }
    get first() {
        return this.data[0];
    }
    get last(){
        return this.data[this.data.length - 1];
    }

    currentRange(){
        return this.setRange(this.range, false);
    }

    setRange(range, useDelta=true){
        const [rowsInRange, idx] = !useDelta && range.lo === this.range.lo && range.hi === this.range.hi
            ? this.iter.currentRange()
            : this.iter.setRange(range, useDelta);

        const filterCount = this.filterSet && this.meta.FILTER_COUNT;
        const rows = rowsInRange.map((row,i) => this.cloneRow(row, idx+i, filterCount));
        this.range = range;
        return {
            rows,
            range,
            size: this.length,
            offset: this.offset,
            selectedIndices: this.selectedIndices
        };
    }

    cloneRow(row, idx, FILTER_COUNT){
        const {IDX, DEPTH, COUNT} = this.meta;
        const dolly = row.slice();
        dolly[IDX] = idx + this.offset;

        if (FILTER_COUNT && dolly[DEPTH] !== 0 && typeof dolly[FILTER_COUNT] === 'number'){
            dolly[COUNT] = dolly[FILTER_COUNT];
        }
        return dolly;
    }

    applyGroupby(groupby, rows=this.data){
        const { columns } = this;
        this.groupRows.length = 0;
        const groupCols = mapSortCriteria(groupby, this.columnMap);
        this.groupRows = groupRows(rows, this.sortSet, columns, this.columnMap, groupCols, {
            groups: this.groupRows, rowParents: this.rowParents
        });
        this.currentLength = this.countVisibleRows(this.groupRows);
    }

    groupBy(groupby) {

        if (groupbySortReversed(groupby, this.groupby)) {
            this.sortGroupby(groupby);
        } else if (groupbyExtendsExistingGroupby(groupby, this.groupby)) {
            this.extendGroupby(groupby);
            this.currentLength = this.countVisibleRows(this.groupRows, this.filterSet !== null);
        } else if (groupbyReducesExistingGroupby(groupby, this.groupby)) {
            this.reduceGroupby(groupby);
            this.range = NULL_RANGE;
            this.iter.clear();
            this.currentLength = this.countVisibleRows(this.groupRows, this.filterSet !== null);
        } else {
            this.applyGroupby(groupby);
        }
        this.groupby = groupby;

    }

    // User interaction will never produce more than one change, but programatic change might !
    //TODO if we have sortCriteria, apply to leaf rows as we expand
    setGroupState(groupState) {
        // onsole.log(`[groupRowSet.setGroupState] ${JSON.stringify(groupState,null,2)}`)
        const changes = getGroupStateChanges(groupState, this.groupState);
        changes.forEach(([key, ,isExpanded]) => {
            const {groupRows} = this;
            if (key === '*') {
                this.toggleAll(isExpanded);
                this.currentLength = this.countVisibleRows(groupRows, false);
            } else {
                const groupIdx= this.findGroupIdx(key);
                if (groupIdx !== -1){
                    if (isExpanded){
                        this.currentLength += this.expandGroup(groupIdx, groupRows);
                    } else {
                        this.currentLength -= this.collapseGroup(groupIdx, groupRows);
                    }
                } else {
                    console.warn(`setGroupState could not find row to toggle`);
                }
            }
        });
        this.groupState = groupState;
    }

    expandGroup(idx, groups){
        return this.toggleGroup(idx, groups, this.countChildGroups);
    }

    collapseGroup(idx, groups){
        return this.toggleGroup(idx, groups, this.collapseChildGroups);
    }

    toggleGroup(groupIdx, groupRows, processChildGroups){
        const {DEPTH, COUNT, FILTER_COUNT} = this.meta;
        let adjustment = 0;
        const groupRow = groupRows[groupIdx];
        const depth = groupRow[DEPTH];
        const useFilter = this.filterSet !== null;
        groupRow[DEPTH] = -depth;
        if (Math.abs(depth) === 1){
            const COUNT_IDX = useFilter ? FILTER_COUNT : COUNT;
            adjustment = groupRow[COUNT_IDX];
        } else {
            adjustment = processChildGroups(Math.abs(depth)-1, groupIdx+1, groupRows, useFilter);
        }
        return adjustment;
    }

    countChildGroups(childDepth, startIdx, groupRows, useFilter){
        const {DEPTH, FILTER_COUNT} = this.meta;
        let adjustment = 0;
        for (let i=startIdx; i<groupRows.length; i++){
            const nextDepth = groupRows[i][DEPTH];
            if (Math.abs(nextDepth) === childDepth){
                if (!useFilter || groupRows[i][FILTER_COUNT] > 0){
                    adjustment += 1;
                }
            } else if (Math.abs(nextDepth) > childDepth){
                break;
            }
        }
        return adjustment;
    }

    collapseChildGroups(childDepth, startIdx, groupRows, useFilter){
        const {DEPTH, FILTER_COUNT} = this.meta;
        let adjustment = 0;
        for (let i=startIdx; i<groupRows.length; i++){
            const nextDepth = groupRows[i][DEPTH];
            if (Math.abs(nextDepth) === childDepth){
                if (!useFilter || groupRows[i][FILTER_COUNT] > 0){
                    adjustment += 1;
                    if (nextDepth > 0){
                        adjustment += this.collapseGroup(i, groupRows);
                    }
                }
            } else if (Math.abs(nextDepth) > childDepth){
                break;
            }
        }
        return adjustment;
    }

    sort(sortCriteria) {
        const {groupRows: groups} = this;
        const { IDX, DEPTH, COUNT, IDX_POINTER } = this.meta;
        this.sortCriteria = Array.isArray(sortCriteria) && sortCriteria.length
            ? sortCriteria
            : null;

        const sortCols = mapSortCriteria(sortCriteria, this.columnMap);
        //TODO only need to handle visible rows
        for (let i=0;i<groups.length;i++){
            const groupRow = groups[i];
            const depth = groupRow[DEPTH];
            const count = groupRow[COUNT];
            const absDepth = Math.abs(depth);
            const sortIdx = groupRow[IDX_POINTER];
            if (absDepth === 1){
                this.sortDataSubset(sortIdx, count, sortCols, IDX);

            }
        }
    }

    sortDataSubset(startIdx, length, sortCriteria, IDX){
        const rows = [];
        for (let i=startIdx;i<startIdx+length;i++){
            const rowIdx = this.sortSet[i];
            rows.push(this.data[rowIdx]);
        }
        rows.sort(sortBy(sortCriteria));
        for (let i=0;i<rows.length;i++){
            this.sortSet[i+startIdx] = rows[i][IDX];
        }
    }

    clearFilter(/*cloneChanges*/) {
        this.currentFilter = null;
        this.filterSet = null;
        // rebuild agregations for groups where filter count is less than count, remove filter count
        const { data: rows, groupRows: groups, sortSet, columns } = this;
        const { COUNT, FILTER_COUNT, NEXT_FILTER_IDX } = this.meta;
        const aggregations = findAggregatedColumns(columns, this.columnMap, this.groupby);

        for (let i=0;i<groups.length; i++){
            let groupRow = groups[i];
            if (typeof groupRow[FILTER_COUNT] === 'number' && groupRow[COUNT] > groupRow[FILTER_COUNT]){
                aggregateGroup(groups, i, sortSet, rows, columns, aggregations);
                groupRow[FILTER_COUNT] = null;
                groupRow[NEXT_FILTER_IDX] = null;
            }
        }

        this.iter.setNavSet(this.selectNavigationSet(false));
        this.currentLength = this.countVisibleRows(groups, false);
    }

    filter(filter){
        const extendsCurrentFilter = extendsFilter(this.currentFilter, filter);
        const fn = filter && functor(this.columnMap, filter);
        const { COUNT, DEPTH, PARENT_IDX, FILTER_COUNT, NEXT_FILTER_IDX } = this.meta;
        const { data: rows, groupRows: groups } = this;
        let [navSet, NAV_IDX, NAV_COUNT] = this.selectNavigationSet(extendsCurrentFilter && this.filterSet);
        const newFilterSet= [];

        for (let i=0;i<groups.length; i++){
            let groupRow = groups[i];
            const depth = groupRow[DEPTH];
            const count = getCount(groupRow,NAV_COUNT, COUNT);
            const absDepth = Math.abs(depth);

            if (absDepth === 1){
                const sortIdx = groupRow[NAV_IDX];
                let rowCount = 0;

                for (let ii=sortIdx; ii<sortIdx+count; ii++){
                    const rowIdx = navSet[ii];
                    const row = rows[rowIdx];
                    const includerow = fn(row);
                    if (includerow) {
                        rowCount += 1;
                        if (rowCount === 1){
                            groupRow[NEXT_FILTER_IDX] = newFilterSet.length;
                        }
                        newFilterSet.push(rowIdx);
                    }
                }

                groupRow[FILTER_COUNT] = rowCount;
                let aggregations = EMPTY_ARRAY;
                // we cannot be sure what filter changes have taken effect, so we must recalculate aggregations
                if (this.aggregations.length){
                    aggregations = this.aggregations.map(([i, a]) => [i,a,0]);
                    const len = newFilterSet.length;
                    for (let ii=len-rowCount;ii<len;ii++){
                        const rowIdx = newFilterSet[ii];
                        const row = rows[rowIdx];
                        for (let j = 0; j < aggregations.length; j++) {
                            let [colIdx] = aggregations[j];
                            aggregations[j][2] += row[colIdx];
                        }
                    }
                    
                    // 2) store aggregates at lowest level of the group hierarchy
                    aggregations.forEach(aggregation => {
                        const [colIdx, type, sum] = aggregation;
                        if (type === 'sum') {
                            groupRow[colIdx] = sum;
                        } else if (type === 'avg') {
                            groupRow[colIdx] = sum / rowCount;
                        }
                    });
                }

                // update parent counts
                if (rowCount > 0){
                    while (groupRow[PARENT_IDX] !== null){
                        groupRow = groups[groupRow[PARENT_IDX]];

                        aggregations.forEach(aggregation => {
                            const [colIdx, type, sum] = aggregation;
                            if (type === 'sum') {
                                groupRow[colIdx] += sum;
                            } else if (type === 'avg') {
                                const originalCount = groupRow[FILTER_COUNT];
                                const originalSum = originalCount * groupRow[colIdx];
                                groupRow[colIdx] = (originalSum + sum) / (originalCount + rowCount);
                            }
                        });
                        groupRow[FILTER_COUNT] += rowCount;
                    }
                }

            } else {
                // Higher-level group aggregations are calculated from lower level groups
                // initialize aggregated columns
                groupRow[FILTER_COUNT] = 0;
                this.aggregations.forEach(aggregation => {
                    const [colIdx] = aggregation;
                    groupRow[colIdx] = 0;
                });
            }
        }
        this.filterSet = newFilterSet;
        this.currentFilter = filter;
        this.currentLength = this.countVisibleRows(this.groupRows, true);

        this.iter.setNavSet(this.selectNavigationSet(true));

    }

    update(rowIdx, updates){
        const {groupRows: groups, offset, rowParents, range: {lo}} = this;
        const { COUNT, FILTER_COUNT, PARENT_IDX } = this.meta;

        let groupUpdates;
        const rowUpdates = [];

        for (let i = 0; i < updates.length; i += 3) {
            // the col mappings in updates refer to base column definitions
            const colIdx = updates[i];
            const originalValue = updates[i + 1];
            const value = updates[i + 2];
            rowUpdates.push(colIdx,originalValue,value);

            let grpIdx = rowParents[rowIdx];
            // this seems to return 0 an awful lot
            let ii = 0;
            
            // If this column is being aggregated
            if (this.aggregatedColumn[colIdx]){

                groupUpdates = groupUpdates || [];
                // collect adjusted aggregations for each group level
                do {
                    let groupRow = groups[grpIdx];

                    let originalGroupValue = groupRow[colIdx];
                    const diff = value - originalValue;
                    const type = this.aggregatedColumn[colIdx];
                    if (type === 'sum'){
                        // ... wnd in the groupRow we have a further offset of 2 ...
                        groupRow[colIdx] += diff;// again with the +2
                    } else if (type === 'avg'){
                        const count = getCount(groupRow, FILTER_COUNT, COUNT);
                        groupRow[colIdx] = ((groupRow[colIdx] * count) + diff) / count;
                    }

                    (groupUpdates[ii] || (groupUpdates[ii]=[grpIdx])).push(colIdx, originalGroupValue, groupRow[colIdx]);

                    grpIdx = groupRow[PARENT_IDX];
                    ii += 1;

                } while (grpIdx !== null)

            }
        }

        const outgoingUpdates = [];
        // check rangeIdx for both row and group updates, if they are not in range, they have not been
        // sent to client and do not need to be added to outgoing updates
        if (groupUpdates){
            // the groups are currently in reverse order, lets send them out outermost group first
            for (let i=groupUpdates.length-1; i >=0; i--){
                const [grpIdx, ...updates] = groupUpdates[i];
                // won't work - need to chnage groupIterator
                const rangeIdx = this.iter.getRangeIndexOfGroup(grpIdx);
                if (rangeIdx !== -1){
                    outgoingUpdates.push([lo+rangeIdx+offset, ...updates]);
                }
            }
        }
        const rangeIdx = this.iter.getRangeIndexOfRow(rowIdx);
        if (rangeIdx !== -1){
            // onsole.log(`[GroupRowSet.update] updates for row idx ${idx} ${rangeIdx+offset} ${JSON.stringify(rowUpdates)}`)
            outgoingUpdates.push([lo+rangeIdx+offset, ...rowUpdates]);
        }
        
        return outgoingUpdates;
    }

    insert(newRowIdx, row){
        // TODO look at append and idx manipulation for insertion at head.
        const { groupRows: groups, groupby, data: rows, sortSet, columns, meta, iter: iterator } = this;
        let groupCols = mapSortCriteria(groupby, this.columnMap);
        const groupPositions = findGroupPositions(groups, groupCols, row);
        const {IDX, COUNT, KEY, IDX_POINTER} = meta;
        const GROUP_KEY_SORT = [[KEY, 'asc']];
        const allGroupsExist = groupPositions.length === groupby.length;
        const noGroupsExist = groupPositions.length === 0;
        const someGroupsExist = !noGroupsExist && !allGroupsExist;
        let result;
        let newGroupIdx = null;

        if (allGroupsExist){
            // all necessary groups are already in place, we will just insert a row and update counts/aggregates
            let grpIdx = groupPositions[groupPositions.length-1];
            const groupRow = groups[grpIdx];
            this.rowParents[newRowIdx] = grpIdx;
            let count = groupRow[COUNT];

            const insertionPoint = groupRow[IDX_POINTER] + count;
            // all existing pointers from the insertionPoint forward are going to be displaced by +1
            adjustLeafIdxPointers(groups, insertionPoint, meta);
            sortSet.splice(insertionPoint,0,row[IDX]);
            if (allGroupsExpanded(groups, groupRow, meta)){
                this.currentLength += 1;
            }
            
        } else {

            newGroupIdx = sortPosition(groups, sortBy(GROUP_KEY_SORT), expandRow(groupCols, row, meta), 'last-available');
            sortSet.push(newRowIdx);
            let nestedGroups, baseGroupby, rootIdx;

            if (someGroupsExist){
                baseGroupby = groupCols.slice(0,groupPositions.length);
                rootIdx = groups[groupPositions[groupPositions.length-1]][IDX];
                groupCols = groupCols.slice(groupPositions.length);
            }

            nestedGroups = groupRows(rows, sortSet, columns, this.columnMap, groupCols, {
                startIdx: sortSet.length - 1, length: 1, groupIdx: newGroupIdx-1,
                baseGroupby, rootIdx
            });

            adjustGroupIndices(groups, newGroupIdx, meta, nestedGroups.length);
            groups.splice.apply(groups,[newGroupIdx,0].concat(nestedGroups));
        }

        this.incrementGroupCounts(groupPositions);
        this.updateAggregatedValues(groupPositions, row);

        iterator.refresh(); // force iterator to rebuild rangePositions
        let rangeIdx = allGroupsExist
            ? iterator.getRangeIndexOfRow(newRowIdx)
            : iterator.getRangeIndexOfGroup(newGroupIdx);
        
        if (rangeIdx !== -1){
            // New row is visible within viewport so we will force render all rows
            result = {replace: true};
            if (newGroupIdx !== null){
                this.currentLength += 1;
            }
        } else if (noGroupsExist === false){
            // new row is not visible as group is collapsed, but we need to update groiup row(s)
            result = {updates: this.collectGroupUpdates(groupPositions)};
        }

        return result;
    }

    incrementGroupCounts(groupPositions){
        const {groupRows: groups, meta:{COUNT}} = this;
        groupPositions.forEach(grpIdx => {
            const group = groups[grpIdx];
            group[COUNT] += 1;
        });
    }

    updateAggregatedValues(groupPositions, row){
        const { groupRows: groups } = this;

        groupPositions.forEach(grpIdx => {
            const group = groups[grpIdx];
            for (let [key, type] of this.aggregations){
                const value = row[key];
                const groupValue = group[key];
                if (type === 'sum'){
                    group[key] = groupValue + value;
                }
            }
        });

    }

    collectGroupUpdates(groupPositions){
        const {aggregations, groupRows: groups, meta:{COUNT}, offset} = this;
        const updates = [];
        for (let grpIdx of groupPositions){
            const rangeIdx = this.iter.getRangeIndexOfGroup(grpIdx);
            if (rangeIdx !== -1){
                const group = groups[grpIdx];
                const update = [rangeIdx+offset, COUNT, group[COUNT]];
                for (let [key] of aggregations){
                    update.push(key, group[key]);
                }
                updates.push(update);
            }
        }
        return updates;
    }



    // start with a simplesequential search
    findGroupIdx(groupKey){
        const {groupRows, meta} = this;
        for (let i=0;i<groupRows.length;i++){
            if (groupRows[i][meta.KEY] === groupKey){
                return i;
            }
        }
        return -1;
    }

    //TODO simple implementation first
    toggleAll(isExpanded) {
        const sign = isExpanded ? 1 : -1;
        // iterate groupedRows and make every group row depth positive,
        // Then visible rows is not going to be different from grouped rows
        const {DEPTH} = this.meta;
        const { groupRows: groups } = this;
        this.expandedByDefault = isExpanded;
        for (let i = 0, len = groups.length; i < len; i++) {
            const depth = groups[i][DEPTH];
            // if (depth !== 0) {
            groups[i][DEPTH] = Math.abs(depth) * sign;
            // }
        }
    }

    sortGroupby(groupby){
        const { IDX, KEY, DEPTH, IDX_POINTER, PARENT_IDX } = this.meta;
        const {groupRows: groups} = this;
        const groupCols = mapSortCriteria(groupby, this.columnMap);
        const [colIdx, depth] = findSortedCol(groupby, this.groupby);
        let count = 0;
        let i=0;
        for (;i<groups.length;i++){
            if (Math.abs(groups[i][DEPTH]) > depth){
                if (count > 0){
                    this.sortGroupRowsSubset(groupCols, colIdx, i-count, count);
                    count = 0;
                }
            } else {
                count += 1;
            }
        }

        this.sortGroupRowsSubset(groupCols, colIdx, i-count, count);

        const tracker = new SimpleTracker(groupby.length);
        this.groupRows.forEach((groupRow,i) => {
            const depth = groupRow[DEPTH];
            const groupKey = groupRow[KEY];
            const absDepth = Math.abs(depth);
            tracker.set(absDepth, i, groupKey);
            groupRow[IDX] = i;
            if (absDepth > 1){
                groupRow[IDX_POINTER] = i+1;
            }
            if (tracker.hasParentPos(absDepth)){
                groupRow[PARENT_IDX] = tracker.parentPos(absDepth);
            }
        });
    }

    sortGroupRowsSubset(groupby, colIdx, startPos=0, length=this.groupRows.length){
        const {groupRows: groups} = this;
        let insertPos = startPos + length;
        const [groupColIdx, direction] = groupby[colIdx];
        const before = (k1, k2) => direction === ASC ? k2 > k1 : k1 > k2;
        const after = (k1, k2) => direction === ASC ? k2 < k1 : k1 < k2;
        let currentKey = null;
        for (let i=startPos;i<startPos+length;i++){
            const key = groups[i][groupColIdx];
            if (currentKey === null){
                currentKey = key;
            } else if (before(key,currentKey)){
                const splicedRows = groups.splice(startPos,i-startPos);
                insertPos -= splicedRows.length;
                groups.splice.apply(groups, [insertPos,0].concat(splicedRows));
                currentKey = key;
                i = startPos-1;
            } else if (after(key,currentKey)){
                break;
            }
        }
    }

    // there is a current assumption here that new col(s) are always added at the end of existing cols in the groupBy
    // Need to think about a new col inserted at start or in between existing cols 
    //TODO we might want to do this on expanded nodes only and repat in a lazy fashion as more nodes are revealed
    extendGroupby(groupby) {
        const groupCols = mapSortCriteria(groupby, this.columnMap);
        const baseGroupCols = groupCols.slice(0, this.groupby.length);
        const newGroupbyClause = groupCols.slice(this.groupby.length);
        const {groupRows: groups, groupby: baseGroupby, data: rows, columns, sortSet, filterSet, meta} = this;
        const { IDX_POINTER, PARENT_IDX, NEXT_FILTER_IDX } = meta;
        const baseLevels = baseGroupby.length;
        const tracker = new GroupIdxTracker(baseLevels-1);
        const filterFn = this.currentFilter
            ? functor(this.columnMap, this.currentFilter)
            : null;

        // we are going to insert new rows into groupRows and update the PARENT_IDX pointers in data rows
        for (let i=0;i<groups.length;i++){
            const groupRow = groups[i];
            if (tracker.idxAdjustment){
                groupRow[meta.IDX] += tracker.idxAdjustment;
            }

            const rootIdx = groupRow[meta.IDX];
            const depth = groupRow[meta.DEPTH];
            const length = groupRow[meta.COUNT];
            const groupKey = groupRow[meta.KEY];

            const absDepth = Math.abs(depth);
            groupRow[meta.DEPTH] = incrementDepth(depth);
            const filterLength = groupRow[meta.FILTER_COUNT];
            const filterIdx = groupRow[NEXT_FILTER_IDX];
            groupRow[meta.NEXT_FILTER_IDX] = undefined;

            if (tracker.hasPrevious(absDepth+1)){
                groupRow[PARENT_IDX] += tracker.previous(absDepth+1);
            }

            if (absDepth === 1){
                const startIdx = groupRow[IDX_POINTER];
                const nestedGroupRows = groupRows(rows, sortSet, columns, this.columnMap, newGroupbyClause, {
                    startIdx,
                    length,
                    rootIdx,
                    baseGroupby: baseGroupCols,
                    groupIdx: rootIdx,
                    filterIdx,
                    filterLength,
                    filterSet,
                    filterFn,
                    rowParents: this.rowParents
                });
                const nestedGroupCount = nestedGroupRows.length;
                // this might be a performance problem for large arrays, might need to concat
                groups.splice(i+1,0, ...nestedGroupRows);
                i += nestedGroupCount;
                tracker.increment(nestedGroupCount);
            } else {
                tracker.set(absDepth, groupKey);
            }
            // This has to be a pointer into sortSet NOT rows
            groupRow[IDX_POINTER] = rootIdx+1;
        }
    }

    reduceGroupby(groupby) {
        const { groupRows: groups, filterSet } = this;
        const [doomed] = findDoomedColumnDepths(groupby, this.groupby);
        const groupCols = mapSortCriteria(this.groupby, this.columnMap);
        const [lastGroupIsDoomed, baseGroupby, addGroupby] = splitGroupsAroundDoomedGroup(groupCols, doomed);
        const { IDX, DEPTH, KEY, IDX_POINTER, PARENT_IDX, NEXT_FILTER_IDX } = this.meta;
        const tracker = new GroupIdxTracker(groupby.length);
        const useFilter = filterSet !== null;
        let currentGroupIdx = null;
        let i = 0;
        for (let len=groups.length;i<len;i++){
            const groupRow = groups[i];
            const depth = groupRow[DEPTH];
            const groupKey = groupRow[KEY];
            const absDepth = Math.abs(depth);

            if (absDepth === doomed){
                this.reParentLeafRows(i, currentGroupIdx);
                groups.splice(i,1);
                i -= 1;
                len -= 1;
                tracker.increment(1);
            } else {
                if (absDepth > doomed){
                    tracker.set(absDepth,groupKey);
                    if (absDepth === doomed + 1){
                        if (lastGroupIsDoomed){
                            // our pointer will no longer be to a child group but (via the sortSet) to the data.
                            // This can be taken from the first child group (which will be removed)
                            groupRow[IDX_POINTER] = lowestIdxPointer(groups, IDX_POINTER, DEPTH, i+1, absDepth-1);
                            groupRow[NEXT_FILTER_IDX] = useFilter ? lowestIdxPointer(groups, NEXT_FILTER_IDX, DEPTH, i+1, absDepth-1) : undefined;
                        } else if (currentGroupIdx !== null){
                            const diff = this.regroupChildGroups(currentGroupIdx, i, baseGroupby, addGroupby);
                            i -= diff;
                            len -= diff;
                            tracker.increment(diff);
                        }
                    }
                    currentGroupIdx = i;
                    if (tracker.hasPrevious(absDepth+1)){
                        groupRow[PARENT_IDX] -= tracker.previous(absDepth+1);
                    }
                    groupRow[DEPTH] = decrementDepth(depth);
                }
                if (tracker.idxAdjustment > 0){
                    groupRow[IDX] -= tracker.idxAdjustment;
                    if (Math.abs(groupRow[DEPTH]) > 1){
                        groupRow[IDX_POINTER] -= tracker.idxAdjustment;
                    }
                }
            }
        }
        if (!lastGroupIsDoomed){
            // don't forget the final group ...
            this.regroupChildGroups(currentGroupIdx, i, baseGroupby, addGroupby);
        }
    }

    reParentLeafRows(groupIdx, newParentGroupIdx){
        // TODO what about filterSet ?
        const {groupRows: groups, rowParents, sortSet, meta: {IDX_POINTER, COUNT}} = this;
        const group = groups[groupIdx];
        const idx = group[IDX_POINTER];
        const count = group[COUNT];

        for (let i=idx; i< idx+count; i++){
            const rowIdx = sortSet[i];
            rowParents[rowIdx] = newParentGroupIdx; 
        }

    }

    regroupChildGroups(currentGroupIdx, nextGroupIdx, baseGroupby, addGroupby){
        const { groupRows: groups, data: rows, columns, meta } = this;
        const { COUNT, IDX_POINTER } = meta;
        const group = groups[currentGroupIdx];
        const length = group[COUNT];
        const startIdx = groups[currentGroupIdx+1][IDX_POINTER];
        // We don't really need to go back to rows to regroup, we have partially grouped data already
        // we could perform the whole operation within groupRows
        const nestedGroupRows = groupRows(rows, this.sortSet, columns, this.columnMap, addGroupby, {
            startIdx,
            length,
            rootIdx: currentGroupIdx,
            baseGroupby,
            groupIdx: currentGroupIdx,
            rowParents: this.rowParents
        });
        const existingChildNodeCount = nextGroupIdx - currentGroupIdx - 1;
        groups.splice(currentGroupIdx+1,existingChildNodeCount,...nestedGroupRows);
        group[IDX_POINTER] = currentGroupIdx+1;
        return existingChildNodeCount - nestedGroupRows.length;

    }

    // Note: this assumes no leaf rows visible. Is that always valid ?
    // NOt after removing a groupBy ! Not after a filter
    countVisibleRows(groupRows, usingFilter=false){
        const {DEPTH, COUNT, FILTER_COUNT} = this.meta;
        let count = 0;
        for (let i=0, len=groupRows.length;i<len;i++){
            const zeroCount = usingFilter && groupRows[i][FILTER_COUNT] === 0;
            if (!zeroCount){
                count += 1;
            }
            const depth = groupRows[i][DEPTH];
            if (depth < 0 || zeroCount){
                while (i<len-1 && Math.abs(groupRows[i+1][DEPTH]) < -depth){
                    i += 1;
                }
            } else if (depth === 1){
                count += (usingFilter ? groupRows[i][FILTER_COUNT] : groupRows[i][COUNT]);
            }
        }
        return count;
    }

}

/*
    Inserts (and size records) and updates must be batched separately. Because updates are 
    keyed by index position and index positions may be affected by an insert operation, the
    timeline must be preserved. Updates can be coalesced until an insert is received. Then
    the update batch must be closed, to be followed by the insert(s). Similarly, multiple
    inserts, with no interleaved updates, can be batched (with a single size record). The batch
    will be closed as soon as the next update is received. So we alternate between update and
    insert processing, with each transition athe preceeding batch is closed off.
    An append is a simple insert that has no re-indexing implications.  

*/
class UpdateQueue {

    constructor(){
        this._queue = [];
    }

      get length() { return this._queue.length; }

      update(update) {
          //TODO we could also coalesce updates into an insert or rowset, if present
          const batch = this.getCurrentBatch('update');

          const [rowIdx] = update;
          const {updates} = batch;

          for (let i = 0, len = updates.length; i < len; i++) {
              if (updates[i][0] === rowIdx) {
                  // we already have an update for this item, update the update...
                  let d = updates[i];
                  for (let colIdx = 1; colIdx < update.length; colIdx += 2) {
                      const pos = d.indexOf(update[colIdx]);
                      if (pos === -1) {// should check that it is really a colIdx,not a value
                          d.push(update[colIdx], update[colIdx + 1]);
                      } else {
                          d[pos + 1] = update[colIdx + 1];
                      }
                  }

                  return;
              }
          }
          updates.push(update);
      }

      resize(size) {
          const batch = this.getCurrentBatch('size');
          batch.size = size;
      }

      append(row, offset) {
          const batch = this.getCurrentBatch('insert');
          //onsole.log(`UpdateQueue append ${row[0]}`);
          batch.rows.push(row);
          batch.offset = offset;
      }

      replace(rows, size, offset) {
          const batch = this.getCurrentBatch('rowset');
          batch.rows = rows;
          batch.size = size;
          batch.offset = offset;
      }

      popAll() {
          const results = this._queue;
          this._queue = [];
          return results;
      }

      getCurrentBatch(type) {

          const q = this._queue;
          const len = q.length;

          let batch = len === 0 || type === 'rowset'
              ? (q[0] = createBatch(type))
              : q[len - 1];

          if (batch.type !== type) {
              // roll size recored into subsequent insert 
              if (type === 'insert' && batch.type === 'size') {
                  batch.type = 'insert';
                  batch.rows = [];
              } else if (type === 'size' && batch.type === 'insert') ; else {
                  batch = (q[len] = createBatch(type));
              }
          }

          return batch;

      }
  }

function createBatch(type) {
    switch (type) {
    case 'rowset': return { type, rows: [] };
    case 'update': return { type, updates: [] };
    case 'insert': return { type, rows: [] };
    case 'size': return { type };
    default: throw Error('Unknown batch type');
    }
}

const DEFAULT_INDEX_OFFSET = 100;

class DataView {

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
            const { rows, size, offset } = rowSet.currentRange();
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

    select(idx, rangeSelect, keepExistingSelection){
        console.log(`InMemoryView.select ${idx} rangeSelect:${rangeSelect}, keepExistingSelection: ${keepExistingSelection}`);
        return this.rowSet.select(idx, rangeSelect, keepExistingSelection);
        //TODO eliminate rows not in range
    
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
                    // TODO examine this. Must be a more efficient way to reset counts in filterSet
                    const {columnName, range} = filterRowSet;
                    this.filterRowSet = rowSet.getDistinctValuesForColumn({name:columnName});
                    filterResultset = this.filterRowSet.setRange(range, false);
                }
            }
    
            const resultSet = {
                ...(this.rowSet.setRange(resetRange(range), false)),
                filter
            };
    
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

    getFilterData(column, searchText = null, range) {
        console.log(`getFilterData searchText='${searchText}'`);
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
            console.error(`[InMemoryView] filterfilterRowSet no filterRowSet`);
        }

    }

}

/*
  See UpdateQueue
*/

class UpdateQueue$1 extends EventEmitter {

    update(update) {
        this.emit('update', [update]);
    }

    resize(size) {
        console.log(`localUpdateQueue resize ${JSON.stringify(size)}`);
    }

    append(row, offset) {
        console.log(`localUpdateQueue append ${JSON.stringify(row)} offset ${offset}`);
    }

    replace({rows, size, offset}) {
        console.log(`localUpdateQueue replace ${JSON.stringify(rows)} size ${size} offset ${offset}`);
        this.emit(DataTypes.ROW_DATA, rows, size, offset);
    }

    popAll() {
        console.log(`localUpdateQueue popAll`);
    }
}

const buildDataView = async url =>
  import(/* webpackIgnore: true */ url)
    .catch(err => console.log(`failed to load data at ${url} ${err}`));

const logger = createLogger('LocalDataView', logColor.blue);

class LocalDataView {
  constructor({
    url,
    tableName
  }) {
    // note: don't wait
    logger.log(`lets try and load ${url}`);
    this.eventualView = buildDataView(url);
    this.columns = null;
    this.meta = null;

    this.tableName = tableName;
    this.subscription = null;
    this.viewport = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;

    this.updateQueue = new UpdateQueue$1();
    this.dataView = null;
    this.clientCallback = null;
    this.range = null;
  }

  async subscribe({
    tableName = this.tableName,
    columns,
    // range = defaultRange,
    // ...options
  }, callback) {

    if (!columns) throw Error("LocalDataView subscribe called without columns");
    
    // TODO options can include sort, groupBy etc
    
    this.tableName = tableName;
    this.columns = columns;
    this.meta = metaData(columns);

    const { default: data } = await this.eventualView;
    const table = new Table({ data, columns });
    this.dataView = new DataView(table, {columns}, this.updateQueue);
    this.clientCallback = callback;

    if (this.range){
      this.setRange(this.range.lo, this.range.hi);
    }
  }

  unsubscribe() {

  }

  setRange(lo, hi) {
    if (this.dataView === null){
      this.range = {lo,hi};
    } else {
      this.clientCallback(this.dataView.setRange({lo, hi}, true, DataTypes.ROW_DATA));
    }
  }

  select(idx, _row, rangeSelect, keepExistingSelection) {
    this.clientCallback(this.dataView.select(idx, rangeSelect, keepExistingSelection));
  }

  group(columns) {
    this.clientCallback(this.dataView.groupBy(columns));
  }

  setGroupState(groupState) {
    this.clientCallback(this.dataView.setGroupState(groupState));
  }

  sort(columns) {
    this.clientCallback(this.dataView.sort(columns));
  }

  filter(filter, dataType = DataTypes.ROW_DATA, incremental = false) {
    // TODO filter call returns an array
    const [rowData, filterData] = this.dataView.filter(filter, dataType, incremental);
    this.clientCallback(rowData);
    if (filterData){
      if (this.clientFilterCallback){
        this.clientFilterCallback({filterData});
      } else {
        this.filterDataMessage = filterData;
      }
      }
  }

  getFilterData(column, searchText) {
      const filterData =  this.dataView.getFilterData(column, searchText);
      if (this.clientFilterCallback){
        this.clientFilterCallback({filterData});
      } else {
        this.filterDataMessage = {filterData};
      }
    }

  subscribeToFilterData(column, range, callback) {
    logger.log(`<subscribeToFilterData>`);
    this.clientFilterCallback = callback;
    this.setFilterRange(range.lo, range.hi);
    if (this.filterDataMessage) {
      callback(this.filterDataMessage);
      // do we need to nullify now ?
    }
  }

  unsubscribeFromFilterData() {
    logger.log(`<unsubscribeFromFilterData>`);
    this.clientFilterCallback = null;
  }

  // To support multiple open filters, we need a column here
  setFilterRange(lo, hi) {
    const message = {
      filterData: this.dataView.setRange({lo, hi}, true, DataTypes.FILTER_DATA)
    };

    if (this.clientFilterCallback){
      this.clientFilterCallback(message);
    } else {
      this.filterDataMessage = message;
    }
  }

}

//TODO neither this file nor filter-data-view belong here - thye are not specific to remote views

const logger$1 = createLogger('BinnedDataView', logColor.brown);

class BinnedDataView {

  constructor(dataView, column) {
    this.dataView = dataView;
    this.column = column;
    this.dataCountCallback = null;
  }

  subscribe({range}, callback) {
    logger$1.log(`<subscribe>`);

    this.dataView.subscribeToFilterData(this.column, range, message => {

      logger$1.log(`callback ${JSON.stringify(message.null, 2)}`);
      const {filterData} = message;
      const {rows, size, range} = filterData;

      logger$1.log(`receive rows ${rows.length} of ${size} range ${JSON.stringify(range)}`, message);

      // const mergedRows = this.processData(rows, size, 0)

      callback(rows);

      // if (this.dataCountCallback){
      //     this.dataCountCallback(dataCounts);
      // }


    });

  }

  destroy(){
    logger$1.log(`<destroy>`);
    this.dataView.unsubscribeFromFilterData(this.column);
}

}

const logger$2 = createLogger('FilterDataView', logColor.brown);

class FilterDataView {

  constructor(dataView, column){
        this.dataView = dataView;
        this.column = column;
        this.dataCountCallback = null;
    }

    subscribe({columns, range}, callback){

        this.columns = columns;
        this.meta = metaData(columns);
        //TODO make range s setter
        this.range = range;
        this.keyCount = range.hi - range.lo;

        this.dataView.subscribeToFilterData(this.column, this.range, message => {
            const {filterData: {dataCounts, ...data}} = message;
            callback(data);
            if (this.dataCountCallback){
                this.dataCountCallback(dataCounts);
            }    
        });
    }

    subscribeToDataCounts(callback){
        this.dataCountCallback = callback;
    }
    unsubscribeFromDataCounts(){
        this.dataCountCallback = null;
    }

    unsubscribe(){
        this.dataView.unsubscribeFromFilterData();
    }

    destroy(){
        logger$2.log(`<destroy>`);
        this.dataView.unsubscribeFromFilterData(this.column);
    }

    // onFilterData = (_, rows, rowCount, totalCount, dataCounts) => {
    //     this.emit(DataTypes.ROW_DATA, rows, rowCount, totalCount, dataCounts);
    // }

    select(idx, row){
        const {KEY, SELECTED} = this.meta;
        const key = row[KEY];
    
        const filter = {
            type: row[SELECTED] === 1 ? NOT_IN : IN,
            colName: this.column.name,
            values: [key]
        };
        // This is enough to filter rows and populate filter display - but how can we add filter markers to UI ?
        this.dataView.filter(filter, DataTypes.ROW_DATA, true);
    
    }

    filter(filter, dataType = DataTypes.FILTER_DATA, incremental=false){
        this.dataView.filter(filter, dataType, incremental);
    }

    getFilterData(column, searchText){
        console.log(`FilterDataView.getFilterData ${JSON.stringify(column)} ${searchText}`);
        this.dataView.getFilterData(column, searchText);
    }

    // TODO we need a filter method to filter results to omit zero value filterCount - call getFilterData on view, passing filter

    setRange(lo, hi){
      this.range = { lo, hi };
      this.dataView.setFilterRange(lo,hi);
    }

    sort(){
        
    }
  
}

const groupHelpers = {
  updateGroupBy,
  indexOfCol,
  groupbyExtendsExistingGroupby
};

const sortUtils = {
  sortByToMap
};

const columnUtils = {
  buildColumnMap,
  getFilterType,
  toColumn,
  toKeyedColumn,
  metaData,
  setFilterColumnMeta
};

const rowUtils = {
  isEmptyRow, update
};

const filter = {
  AND,
  OR,
  IN,
  NOT_IN,
  STARTS_WITH,
  NOT_STARTS_WITH,
  shouldShowFilter,
  addFilter,
  extractFilterForColumn,
  removeFilterForColumn,
  getFilterColumn,
  includesColumn,
  SET_FILTER_DATA_COLUMNS,
  BIN_FILTER_DATA_COLUMNS
};

const rangeUtils = {
  getFullRange,
  resetRange
};

const arrayUtils = {
  partition
};

const DataTypes$1 = DataTypes;

const ASC$1 = ASC;
const DSC$1 = DSC;
const NULL_RANGE$1 = NULL_RANGE;

export { ASC$1 as ASC, BinnedDataView, DSC$1 as DSC, DataTypes$1 as DataTypes, DataView, FilterDataView, LocalDataView, NULL_RANGE$1 as NULL_RANGE, Table, arrayUtils, columnUtils, filter, groupHelpers, rangeUtils, rowUtils, sortUtils };
//# sourceMappingURL=index.js.map
