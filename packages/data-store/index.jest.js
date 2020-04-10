export {
  addFilter,
  AND,
  DataTypes,
  EQUALS,
  extendsFilter,
  extractFilterForColumn,
  getFullRange, 
  IN,
  includesNoValues,
  indexOfCol,
  GREATER_EQ, 
  GREATER_THAN,
  metaData,
  NOT_IN,
  NOT_STARTS_WITH,
  OR,
  STARTS_WITH,
  updateGroupBy
} from '@heswell/utils';

import {
  resetRange,
  NULL_RANGE as NULL } from './src/store/range-utils';

import {groupbyExtendsExistingGroupby } from './src/store/group-utils'

import {
  isEmptyRow,
  update
} from './src/store/rowUtils'

export const groupHelpers = {
  groupbyExtendsExistingGroupby
}

// we only export these for jest testing
export * from './src/store/rowset';
export {default as Table} from './src/store/table';
export {default as DataView} from './src/store/data-store';

export const rowUtils = {
  isEmptyRow, update
}

export const rangeUtils = {
  resetRange
}

export const NULL_RANGE = NULL;
