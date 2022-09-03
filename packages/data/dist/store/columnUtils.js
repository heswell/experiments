import {
  functor,
  overrideColName,
  SET_FILTER_DATA_COLUMNS,
  BIN_FILTER_DATA_COLUMNS
} from "./filter.js";
const SORT_ASC = "asc";
const setFilterColumnMeta = metaData(SET_FILTER_DATA_COLUMNS);
const binFilterColumnMeta = metaData(BIN_FILTER_DATA_COLUMNS);
function mapSortCriteria(sortCriteria, columnMap) {
  return sortCriteria.map((s) => {
    if (typeof s === "string") {
      return [columnMap[s], "asc"];
    } else if (Array.isArray(s)) {
      const [columnName, sortDir] = s;
      return [columnMap[columnName], sortDir || SORT_ASC];
    } else {
      throw Error("columnUtils.mapSortCriteria invalid input");
    }
  });
}
const toKeyedColumn = (column, key) => typeof column === "string" ? { key, name: column } : typeof column.key === "number" ? column : { ...column, key };
const toColumn = (column) => typeof column === "string" ? { name: column } : column;
function buildColumnMap(columns) {
  if (columns) {
    return columns.reduce((map, column, i) => {
      if (typeof column === "string") {
        map[column] = i;
      } else if (typeof column.key === "number") {
        map[column.name] = column.key;
      } else {
        map[column.name] = i;
      }
      return map;
    }, {});
  } else {
    return null;
  }
}
function projectColumns(map, columns, meta) {
  const length = columns.length;
  const { IDX, RENDER_IDX, DEPTH, COUNT, KEY, SELECTED } = meta;
  return (startIdx, offset, selectedRows = []) => (row, i) => {
    const baseRowIdx = row[IDX];
    const out = [];
    for (let i2 = 0; i2 < length; i2++) {
      const colIdx = map[columns[i2].name];
      out[i2] = row[colIdx];
    }
    out[IDX] = startIdx + i + offset;
    out[RENDER_IDX] = 0;
    out[DEPTH] = 0;
    out[COUNT] = 0;
    out[KEY] = row[0];
    out[SELECTED] = selectedRows.includes(baseRowIdx) ? 1 : 0;
    return out;
  };
}
function projectColumnsFilter(map, columns, meta, filter) {
  const length = columns.length;
  const { IDX, RENDER_IDX, DEPTH, COUNT, KEY, SELECTED } = meta;
  const fn = filter ? functor(map, overrideColName(filter, "name"), true) : () => true;
  return (startIdx) => (row, i) => {
    const out = [];
    for (let i2 = 0; i2 < length; i2++) {
      const colIdx = map[columns[i2].name];
      out[i2] = row[colIdx];
    }
    out[IDX] = startIdx + i;
    out[RENDER_IDX] = 0;
    out[DEPTH] = 0;
    out[COUNT] = 0;
    out[KEY] = row[0];
    out[SELECTED] = fn(row) ? 1 : 0;
    return out;
  };
}
function getFilterType(column) {
  return column.filter || getDataType(column);
}
function getDataType({ type = null }) {
  if (type === null) {
    return "set";
  } else if (typeof type === "string") {
    return type;
  } else {
    switch (type.name) {
      case "price":
        return "number";
      default:
        return type.name;
    }
  }
}
function metaData(columns) {
  const start = columns.length === 0 ? -1 : Math.max(
    ...columns.map((column, idx) => typeof column.key === "number" ? column.key : idx)
  );
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
  };
}
export {
  binFilterColumnMeta,
  buildColumnMap,
  getDataType,
  getFilterType,
  mapSortCriteria,
  metaData,
  projectColumns,
  projectColumnsFilter,
  setFilterColumnMeta,
  toColumn,
  toKeyedColumn
};
//# sourceMappingURL=columnUtils.js.map
