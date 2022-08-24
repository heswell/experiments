import {
  getFilterType,
  toColumn,
  toKeyedColumn,
  buildColumnMap,
  metaData,
  setFilterColumnMeta
} from './store/columnUtils';

import { sortByToMap } from './store/sort';
import {
  AND,
  OR,
  EQUALS,
  IN,
  NOT_IN,
  STARTS_WITH,
  NOT_STARTS_WITH,
  GREATER_THAN,
  GREATER_EQ,
  LESS_THAN,
  LESS_EQ,
  addFilter,
  extractFilterForColumn,
  getFilterColumn,
  includesColumn,
  partition,
  removeFilterForColumn,
  SET_FILTER_DATA_COLUMNS,
  BIN_FILTER_DATA_COLUMNS,
  shouldShowFilter
} from './store/filter';

import { getFullRange, resetRange, NULL_RANGE as NULL } from './store/rangeUtils';

import { updateGroupBy, indexOfCol, groupbyExtendsExistingGroupby } from './store/groupUtils';

import { isEmptyRow, update } from './store/rowUtils';

import * as types from './store/types';

export const groupHelpers = {
  updateGroupBy,
  indexOfCol,
  groupbyExtendsExistingGroupby
};

export { default as Table } from './store/table';
export { default as DataView } from './store/data-view';

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
