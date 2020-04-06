
import {
  getFilterType,
  toColumn,
  toKeyedColumn,
  buildColumnMap,
  metaData,
  mapSortCriteria,
  projectColumns,
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
  groupbyExtendsExistingGroupby } from './src/store/group-utils'

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
export {default as LocalDataView} from './src/data-source/local-data-source';
export {default as BinnedDataView} from './src/data-source/binned-data-source';
export {default as FilterDataView} from './src/data-source/filter-data-source';

export const sortUtils = {
  sortByToMap
}

export const columnUtils = {
  buildColumnMap,
  getFilterType,
  mapSortCriteria,
  metaData,
  projectColumns,
  toColumn,
  toKeyedColumn,
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
