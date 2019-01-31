import * as Constants from './store/constants';

import {INCLUDE, EXCLUDE, INCLUDE_SEARCH, EXCLUDE_SEARCH, STARTS_WITH} from './store/filter'
import { getFilterType, toColumn, buildColumnMap } from './store/columnUtils'
import { sortByToMap } from './store/sort'
import { 
  addFilter,
  removeFilterForColumn,
  extractFilterForColumn,
  getFilterColumn,
  includesColumn,
  shouldShowFilter } from './store/filterUtils';
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

export {default as LocalView} from './view/localView';
export {default as FilterView} from './view/filterView';
export {default as BinView} from './view/binView';

export const sortUtils = {
  sortByToMap
}

export const columnUtils = {
  buildColumnMap,
  getFilterType,
  toColumn
}

export const rowUtils = {
  isEmptyRow, mergeAndPurge, purgeAndFill, update
}

export const filter = {
  INCLUDE,
  EXCLUDE,
  STARTS_WITH,
  INCLUDE_SEARCH,
  EXCLUDE_SEARCH
}

export const filterUtils = {
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

export const Data = Constants

export const DataTypes = types.DataTypes;

export const ASC = types.ASC;
export const DSC = types.DSC;
export const NULL_RANGE = NULL;
