export const EQUALS = 'EQ';
export const GREATER_THAN = 'GT';
export const GREATER_EQ = 'GE';
export const LESS_THAN = 'LT';
export const LESS_EQ = 'LE';
export const AND = 'AND';
export const STARTS_WITH = 'SW';
export const SET = 'set';
export const INCLUDE = 'include';
export const EXCLUDE = 'exclude';
// export const INCLUDE_SEARCH = 'include-search-results';
// export const EXCLUDE_SEARCH = 'exclude-search-results';

export default function filterRows(rows, columnMap, filter) {
    return applyFilter(rows, functor(columnMap, filter));
}

export function functor(columnMap, filter) {
    //TODO convert filter to include colIdx ratherthan colName, so we don't have to pass cols
    switch (filter.type) {
    case SET: return filter.mode === EXCLUDE
        ? testExclude(columnMap, filter)
        : testInclude(columnMap, filter);
    case EQUALS: return testEQ(columnMap, filter);
    case GREATER_THAN: return testGT(columnMap, filter);
    case GREATER_EQ: return testGE(columnMap, filter);
    case LESS_THAN: return testLT(columnMap, filter);
    case LESS_EQ: return testLE(columnMap, filter);
    case STARTS_WITH: return testSW(columnMap, filter);
    case AND: return testAND(columnMap, filter);
    default:
        console.log(`unrecognized filter type ${filter.type}`);
        return () => true;
    }
}

function applyFilter(rows, filter) {
    const results = [];
    for (let i = 0; i < rows.length; i++) {
        if (filter(rows[i])) {
            results.push(rows[i]);
        }
    }
    return results;
}

function testAND(cols, f) {
    const filters = f.filters.map(f1 => functor(cols, f1));
    return row => filters.every(fn => fn(row));
}

function testSW(cols, f) {
    const value = f.value.toLowerCase();
    return f.mode === EXCLUDE
        ? row => row[cols[f.colName]].toLowerCase().indexOf(value) !== 0
        : row => row[cols[f.colName]].toLowerCase().indexOf(value) === 0
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
