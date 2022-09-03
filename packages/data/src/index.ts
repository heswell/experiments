import {
  buildColumnMap,
  getFilterType,
  metaData,
  setFilterColumnMeta,
  toColumn,
  toKeyedColumn
} from './store/columnUtils.js';

import {
  addFilter,
  AND,
  BIN_FILTER_DATA_COLUMNS,
  EQUALS,
  extractFilterForColumn,
  getFilterColumn,
  GREATER_EQ,
  GREATER_THAN,
  IN,
  includesColumn,
  LESS_EQ,
  LESS_THAN,
  NOT_IN,
  NOT_STARTS_WITH,
  OR,
  partition,
  removeFilterForColumn,
  SET_FILTER_DATA_COLUMNS,
  shouldShowFilter,
  STARTS_WITH
} from './store/filter.js';
import { sortByToMap } from './store/sort.js';

import { getFullRange, NULL_RANGE as NULL, resetRange } from './store/rangeUtils.js';

import { groupbyExtendsExistingGroupby, indexOfCol, updateGroupBy } from './store/groupUtils.js';

import { isEmptyRow, update } from './store/rowUtils.js';

import * as types from './store/types.js';

export const groupHelpers = {
  updateGroupBy,
  indexOfCol,
  groupbyExtendsExistingGroupby
};

export { default as DataView } from './store/data-view.js';
export { default as Table } from './store/table.js';

export const sortUtils = {
  sortByToMap
};

export const columnUtils = {
  buildColumnMap,
  getFilterType,
  toColumn,
  toKeyedColumn,
  metaData,
  setFilterColumnMeta
};

export const rowUtils = {
  isEmptyRow,
  update
};

export const filter = {
  AND,
  OR,
  EQUALS,
  IN,
  NOT_IN,
  STARTS_WITH,
  NOT_STARTS_WITH,
  GREATER_EQ,
  GREATER_THAN,
  LESS_EQ,
  LESS_THAN,
  shouldShowFilter,
  addFilter,
  extractFilterForColumn,
  removeFilterForColumn,
  getFilterColumn,
  includesColumn,
  SET_FILTER_DATA_COLUMNS,
  BIN_FILTER_DATA_COLUMNS
};

export const rangeUtils = {
  getFullRange,
  resetRange
};

export const arrayUtils = {
  partition
};

export const DataTypes = types.DataTypes;

export const ASC = types.ASC;
export const DSC = types.DSC;
export const NULL_RANGE = NULL;
