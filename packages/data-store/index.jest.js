

import { sortByToMap } from './src/store/sort'
import {
  getFullRange,
  resetRange,
  NULL_RANGE as NULL } from './src/store/range-utils';

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
export {default as DataView} from './src/store/data-store';

export const sortUtils = {
  sortByToMap
}

export const rowUtils = {
  isEmptyRow, update
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
