
import { getFilterType, toColumn, toKeyedColumn, buildColumnMap, metaData } from './store/columnUtils'
import { sortByToMap } from './store/sort'
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
  removeFilterForColumn,
  shouldShowFilter } from './store/filter';

  import {
  getFullRange,
  resetRange,
  NULL_RANGE as NULL } from './store/rangeUtils';

import {
  toggleGroupState,
  updateGroupBy,
  indexOfCol,
  groupbyExtendsExistingGroupby } from './store/groupUtils'

import {
  isEmptyRow,
  mergeAndPurge,
  purgeAndFill,
  update } from './store/rowUtils'

import * as types from './store/types';

export const groupHelpers = {
  toggleGroupState,
  updateGroupBy,
  indexOfCol,
  groupbyExtendsExistingGroupby
}

export {default as Table} from './store/table';
export {default as InMemoryView} from './store/InMemoryView';

export const sortUtils = {
  sortByToMap
}

export const columnUtils = {
  buildColumnMap,
  getFilterType,
  toColumn,
  toKeyedColumn,
  metaData
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
  includesColumn
}

export const rangeUtils = {
  getFullRange,
  resetRange
}

export const DataTypes = types.DataTypes;

export const ASC = types.ASC;
export const DSC = types.DSC;
export const NULL_RANGE = NULL;
