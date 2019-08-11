
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
  IN,
  NOT_IN,
  STARTS_WITH,
  NOT_STARTS_WITH,
  addFilter,
  extractFilterForColumn,
  getFilterColumn,
  includesColumn,
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
  mergeAndPurge,
  purgeAndFill,
  update } from './src/store/rowUtils'

import * as types from './src/store/types';

export const groupHelpers = {
  updateGroupBy,
  indexOfCol,
  groupbyExtendsExistingGroupby
}

export {default as Table} from './src/store/table';
export {default as DataView} from './src/store/DataView';
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
  isEmptyRow, mergeAndPurge, purgeAndFill, update
}

export const filter = {
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
