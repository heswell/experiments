
import {
  getFilterType,
  toColumn,
  toKeyedColumn,
  buildColumnMap,
  metaData,
  setFilterColumnMeta } from './src/store/columnUtils';

import { sortByToMap } from './src/store/sort'
import {
  AND,
  OR,
  EQUALS,
  IN,
  NOT_IN,
  STARTS_WITH,
  NOT_STARTS_WITH,
  LESS_THAN,
  LESS_EQ,
  GREATER_THAN,
  GREATER_EQ,
  addFilter,
  extendsFilter,
  extractFilterForColumn,
  getFilterColumn,
  includesColumn,
  includesNoValues,
  partition,
  removeFilterForColumn,
  SET_FILTER_DATA_COLUMNS,
  BIN_FILTER_DATA_COLUMNS,
  shouldShowFilter } from './src/store/filter';

  import {
  getFullRange,
  resetRange,
  NULL_RANGE as NULL } from './src/store/rangeUtils';

import {
  updateGroupBy,
  indexOfCol,
  groupbyExtendsExistingGroupby } from './src/store/groupUtils'

import {
  isEmptyRow,
  update
} from './src/store/rowUtils'

import * as types from './src/store/types';

export const groupHelpers = {
  updateGroupBy,
  indexOfCol,
  groupbyExtendsExistingGroupby
}

// we only export these for jest testing
export * from './src/store/rowset';
export {default as Table} from './src/store/table';
export {default as DataView} from './src/store/data-view';
export {default as LocalDataView} from './src/view/local-data-view';
export {default as BinnedDataView} from './src/view/binned-data-view';
export {default as FilterDataView} from './src/view/filter-data-view';

export const sortUtils = {
  sortByToMap
}

export const columnUtils = {
  buildColumnMap,
  getFilterType,
  toColumn,
  toKeyedColumn,
  metaData,
  setFilterColumnMeta
}

export const rowUtils = {
  isEmptyRow, update
}

export const filter = {
  AND,
  OR,
  EQUALS,
  IN,
  NOT_IN,
  STARTS_WITH,
  NOT_STARTS_WITH,
  LESS_THAN,
  LESS_EQ,
  GREATER_THAN,
  GREATER_EQ,
  shouldShowFilter,
  addFilter,
  extendsFilter,
  extractFilterForColumn,
  removeFilterForColumn,
  getFilterColumn,
  includesColumn,
  includesNoValues,
  SET_FILTER_DATA_COLUMNS,
  BIN_FILTER_DATA_COLUMNS
}

export const rangeUtils = {
  getFullRange,
  resetRange
}

export const arrayUtils = {
  partition
}

export const DataTypes = types.DataTypes;

export const ASC = types.ASC;
export const DSC = types.DSC;
export const NULL_RANGE = NULL;
