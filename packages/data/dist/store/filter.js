import * as d3 from "d3-array";
const EQUALS = "EQ";
const GREATER_THAN = "GT";
const GREATER_EQ = "GE";
const LESS_THAN = "LT";
const LESS_EQ = "LE";
const AND = "AND";
const OR = "OR";
const STARTS_WITH = "SW";
const NOT_STARTS_WITH = "NOT_SW";
const IN = "IN";
const NOT_IN = "NOT_IN";
const SET_FILTER_DATA_COLUMNS = [
  { name: "name", key: 0 },
  { name: "count", key: 1, width: 40, type: "number" },
  { name: "totalCount", key: 2, width: 40, type: "number" }
];
const BIN_FILTER_DATA_COLUMNS = [
  { name: "bin" },
  { name: "count" },
  { name: "bin-lo" },
  { name: "bin-hi" }
];
function filterRows(rows, columnMap, filter) {
  return applyFilter(rows, functor(columnMap, filter));
}
function getFilterColumn(column) {
  return column.isGroup ? column.columns[0] : column;
}
function functor(columnMap, filter) {
  switch (filter.type) {
    case IN:
      return testInclude(columnMap, filter);
    case NOT_IN:
      return testExclude(columnMap, filter);
    case EQUALS:
      return testEQ(columnMap, filter);
    case GREATER_THAN:
      return testGT(columnMap, filter);
    case GREATER_EQ:
      return testGE(columnMap, filter);
    case LESS_THAN:
      return testLT(columnMap, filter);
    case LESS_EQ:
      return testLE(columnMap, filter);
    case STARTS_WITH:
      return testSW(columnMap, filter);
    case NOT_STARTS_WITH:
      return testSW(columnMap, filter, true);
    case AND:
      return testAND(columnMap, filter);
    case OR:
      return testOR(columnMap, filter);
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
  const filters = f.filters.map((f1) => functor(cols, f1));
  return (row) => filters.every((fn) => fn(row));
}
function testOR(cols, f) {
  const filters = f.filters.map((f1) => functor(cols, f1));
  return (row) => filters.some((fn) => fn(row));
}
function testSW(cols, f, inversed = false) {
  const value = f.value.toLowerCase();
  return inversed ? (row) => row[cols[f.colName]].toLowerCase().indexOf(value) !== 0 : (row) => row[cols[f.colName]].toLowerCase().indexOf(value) === 0;
}
function testGT(cols, f) {
  return (row) => row[cols[f.colName]] > f.value;
}
function testGE(cols, f) {
  return (row) => row[cols[f.colName]] >= f.value;
}
function testLT(cols, f) {
  return (row) => row[cols[f.colName]] < f.value;
}
function testLE(cols, f) {
  return (row) => row[cols[f.colName]] <= f.value;
}
function testInclude(cols, f) {
  return (row) => f.values.findIndex((val) => val == row[cols[f.colName]]) !== -1;
}
function testExclude(cols, f) {
  return (row) => f.values.findIndex((val) => val == row[cols[f.colName]]) === -1;
}
function testEQ(cols, f) {
  return (row) => row[cols[f.colName]] === f.value;
}
function shouldShowFilter(filterColumnName, column) {
  const filterColumn = getFilterColumn(column);
  if (filterColumn.isGroup) {
    return filterColumn.columns.some((col) => col.name === filterColumnName);
  } else {
    return filterColumnName === filterColumn.name;
  }
}
function includesNoValues(filter) {
  if (!filter) {
    return false;
  } else if (filter.type === IN && filter.values.length === 0) {
    return true;
  } else if (filter.type === AND && filter.filters.some((f) => includesNoValues(f))) {
    return true;
  } else {
    return false;
  }
}
function includesAllValues(filter) {
  if (!filter) {
    return false;
  } else if (filter.type === NOT_IN && filter.values.length === 0) {
    return true;
  } else if (filter.type === STARTS_WITH && filter.value === "") {
    return true;
  } else {
    return false;
  }
}
function extendsFilter(f1 = null, f2 = null) {
  if (f2 === null) {
    return false;
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
        case STARTS_WITH:
          return f2.value.length > f1.value.length && f2.value.indexOf(f1.value) === 0;
        default:
      }
    }
  } else if (f1.colname && f2.colName) {
    return false;
  } else if (f2.type === AND && extendsFilters(f1, f2)) {
    return true;
  }
  return false;
}
const byColName = (a, b) => a.colName === b.colName ? 0 : a.colName < b.colName ? -1 : 1;
function extendsFilters(f1, f2) {
  if (f1.colName) {
    const matchingFilter = f2.filters.find((f) => f.colName === f1.colName);
    return filterEquals(matchingFilter, f1, true);
  } else if (f1.filters.length === f2.filters.length) {
    const a = f1.filters.sort(byColName);
    const b = f2.filters.slice().sort(byColName);
    for (let i = 0; i < a.length; i++) {
      if (!filterEquals(a[i], b[i], true) && !filterExtends(a[i], b[i])) {
        return false;
      }
    }
    return true;
  } else if (f2.filters.length > f1.filters.length) {
    return f1.filters.every((filter1) => {
      const filter2 = f2.filters.find((f) => f.colName === filter1.colName);
      return filterEquals(filter1, filter2, true);
    });
  }
}
function addFilter(existingFilter, filter) {
  if (includesNoValues(filter)) {
    const { colName } = filter;
    existingFilter = removeFilterForColumn(existingFilter, { name: colName });
  } else if (includesAllValues(filter)) {
    return removeFilterForColumn(existingFilter, { name: filter.colName });
  }
  if (!existingFilter) {
    return filter;
  } else if (!filter) {
    return existingFilter;
  }
  if (existingFilter.type === AND && filter.type === AND) {
    return { type: "AND", filters: combine(existingFilter.filters, filter.filters) };
  } else if (existingFilter.type === "AND") {
    const filters = replaceOrInsert(existingFilter.filters, filter);
    return filters.length > 1 ? { type: "AND", filters } : filters[0];
  } else if (filter.type === "AND") {
    return { type: "AND", filters: filter.filters.concat(existingFilter) };
  } else if (filterEquals(existingFilter, filter, true)) {
    return filter;
  } else if (sameColumn(existingFilter, filter)) {
    return merge(existingFilter, filter);
  } else {
    return { type: "AND", filters: [existingFilter, filter] };
  }
}
function replaceOrInsert(filters, filter) {
  const { type, colName, values } = filter;
  if (type === IN || type === NOT_IN) {
    const otherType = type === IN ? NOT_IN : IN;
    let idx = filters.findIndex((f) => f.type === otherType && f.colName === colName);
    if (idx !== -1) {
      const { values: existingValues } = filters[idx];
      if (values.every((value) => existingValues.indexOf(value) !== -1)) {
        if (values.length === existingValues.length) {
          return filters.filter((f, i) => i !== idx);
        } else {
          let newValues = existingValues.filter((value) => !values.includes(value));
          return filters.map((filter2, i) => i === idx ? { ...filter2, values: newValues } : filter2);
        }
      } else if (values.some((value) => existingValues.indexOf(value) !== -1)) {
        console.log(`partial overlap between IN and NOT_IN`);
      }
    } else {
      idx = filters.findIndex((f) => f.type === type && f.colName === filter.colName);
      if (idx !== -1) {
        return filters.map((f, i) => i === idx ? merge(f, filter) : f);
      }
    }
  }
  return filters.concat(filter);
}
function merge(f1, f2) {
  const { type: t1 } = f1;
  const { type: t2 } = f2;
  const sameType = t1 === t2 ? t1 : "";
  if (includesNoValues(f2)) {
    return f2;
  } else if (t1 === IN && t2 === NOT_IN || t1 === NOT_IN && t2 === IN) {
    if (f1.values.length === f2.values.length && f1.values.every((v) => f2.values.includes(v))) {
      if (t1 === IN && t2 === NOT_IN) {
        return {
          colName: f1.colName,
          type: IN,
          values: []
        };
      } else {
        return null;
      }
      return null;
    } else if (f1.values.length > f2.values.length) {
      if (f2.values.every((v) => f1.values.includes(v))) {
        return {
          ...f1,
          values: f1.values.filter((v) => !f2.values.includes(v))
        };
      }
    }
  } else if (sameType === IN || sameType === NOT_IN) {
    return {
      ...f1,
      values: f1.values.concat(f2.values.filter((v) => !f1.values.includes(v)))
    };
  } else if (sameType === STARTS_WITH) {
    return {
      type: OR,
      filters: [f1, f2]
    };
  } else if (sameType === NOT_STARTS_WITH) {
    return {
      type: AND,
      filters: [f1, f2]
    };
  }
  return f2;
}
function combine(existingFilters, replacementFilters) {
  function equivalentType({ type: t1 }, { type: t2 }) {
    return t1 === t2 || t1[0] === t2[0];
  }
  const replaces = (existingFilter, replacementFilter) => {
    return existingFilter.colName === replacementFilter.colName && equivalentType(existingFilter, replacementFilter);
  };
  const stillApplicable = (existingFilter) => replacementFilters.some(
    (replacementFilter) => replaces(existingFilter, replacementFilter)
  ) === false;
  return existingFilters.filter(stillApplicable).concat(replacementFilters);
}
function removeFilter(sourceFilter, filterToRemove) {
  if (filterEquals(sourceFilter, filterToRemove, true)) {
    return null;
  } else if (sourceFilter.type !== AND) {
    throw Error(`removeFilter cannot remove ${JSON.stringify(filterToRemove)} from ${JSON.stringify(sourceFilter)}`);
  } else {
    const filters = sourceFilter.filters.filter((f) => !filterEquals(f, filterToRemove));
    return filters.length > 0 ? { type: AND, filters } : null;
  }
}
function splitFilterOnColumn(filter, columnName) {
  if (!filter) {
    return [null, null];
  } else if (filter.colName === columnName) {
    return [filter, null];
  } else if (filter.type !== "AND") {
    return [null, filter];
  } else {
    const [[columnFilter = null], filters] = partition(filter.filters, (f) => f.colName === columnName);
    return filters.length === 1 ? [columnFilter, filters[0]] : [columnFilter, { type: "AND", filters }];
  }
}
const overrideColName = (filter, colName) => {
  const { type } = filter;
  if (type === AND || type === OR) {
    return {
      type,
      filters: filter.filters.map((f) => overrideColName(f, colName))
    };
  } else {
    return { ...filter, colName };
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
function collectFiltersForColumn(type, filters, columName) {
  const results = [];
  filters.forEach((filter) => {
    const ffc = extractFilterForColumn(filter, columName);
    if (ffc !== null) {
      results.push(ffc);
    }
  });
  if (results.length === 1) {
    return results[0];
  } else {
    return {
      type,
      filters: results
    };
  }
}
function includesColumn(filter, column) {
  if (!filter) {
    return false;
  }
  const { type, colName, filters } = filter;
  switch (type) {
    case AND:
      return filters.some((f) => includesColumn(f, column));
    default:
      return colName === column.name;
  }
}
function removeFilterForColumn(sourceFilter, column) {
  const colName = column.name;
  if (!sourceFilter) {
    return null;
  } else if (sourceFilter.colName === colName) {
    return null;
  } else if (sourceFilter.type === AND || sourceFilter.type === OR) {
    const { type, filters } = sourceFilter;
    const otherColFilters = filters.filter((f) => f.colName !== colName);
    switch (otherColFilters.length) {
      case 0:
        return null;
      case 1:
        return otherColFilters[0];
      default:
        return { type, otherColFilters };
    }
  } else {
    return sourceFilter;
  }
}
const sameColumn = (f1, f2) => f1.colName === f2.colName;
function filterEquals(f1, f2, strict = false) {
  if (f1 && f1) {
    const isSameColumn = sameColumn(f1, f2);
    if (!strict) {
      return isSameColumn;
    } else {
      return isSameColumn && f1.type === f2.type && f1.mode === f2.mode && f1.value === f2.value && sameValues(f1.values, f2.values);
    }
  } else {
    return false;
  }
}
function filterExtends(f1, f2) {
  if (f1.type === IN && f2.type === IN) {
    return f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
  } else if (f1.type === NOT_IN && f2.type === NOT_IN) {
    return f2.values.length > f1.values.length && containsAll(f2.values, f1.values);
  } else {
    return false;
  }
}
function projectFilterData(filterRows2) {
  return filterRows2.map((row, idx) => [idx, 0, 0, null, row.name, row.count]);
}
function getBinnedValues(rows, key, numberOfBins = 20) {
  const numbers = rows.map((row) => row[key]);
  const values = d3.histogram().thresholds(numberOfBins)(numbers).map((arr, i) => [i + 1, arr.length, arr.x0, arr.x1]);
  return values;
}
function containsAll(superList, subList) {
  for (let i = 0, len = subList.length; i < len; i++) {
    if (superList.indexOf(subList[i]) === -1) {
      return false;
    }
  }
  return true;
}
function sameValues(arr1, arr2) {
  if (arr1 === arr2) {
    return true;
  } else if (arr1.length === arr2.length) {
    const a = arr1.slice().sort();
    const b = arr2.slice().sort();
    return a.join("|") === b.join("|");
  }
  return false;
}
function partition(list, test1, test2 = null) {
  const results1 = [];
  const misses = [];
  const results2 = test2 === null ? null : [];
  for (let i = 0; i < list.length; i++) {
    if (test1(list[i])) {
      results1.push(list[i]);
    } else if (test2 !== null && test2(list[i])) {
      results2.push(list[i]);
    } else {
      misses.push(list[i]);
    }
  }
  return test2 === null ? [results1, misses] : [results1, results2, misses];
}
export {
  AND,
  BIN_FILTER_DATA_COLUMNS,
  EQUALS,
  GREATER_EQ,
  GREATER_THAN,
  IN,
  LESS_EQ,
  LESS_THAN,
  NOT_IN,
  NOT_STARTS_WITH,
  OR,
  SET_FILTER_DATA_COLUMNS,
  STARTS_WITH,
  addFilter,
  filterRows as default,
  extendsFilter,
  extractFilterForColumn,
  filterEquals,
  functor,
  getBinnedValues,
  getFilterColumn,
  includesColumn,
  includesNoValues,
  overrideColName,
  partition,
  projectFilterData,
  removeFilter,
  removeFilterForColumn,
  shouldShowFilter,
  splitFilterOnColumn
};
//# sourceMappingURL=filter.js.map
