import {ColumnMeta, Row} from '../store/types'; 

type GroupIteratorInstance = {
  direction: number; // how do we restrict to 0 or 1 without polluting the JS ?
  rangePositions: any;
  setRange: Function;
  currentRange: Function;
  getRangeIndexOfGroup: (grpIdx: number) => number;
  getRangeIndexOfRow: (rowIdx: number) => number;
  setNavSet: Function;
  refresh: Function;
  clear: Function;
}


export type GroupIterator = (
  groups: Row[],
  navSet: number[],
  data: Row[],
  NAV_IDX: number,
  NAV_COUNT: number,
  meta: ColumnMeta
) => GroupIteratorInstance;

declare const GroupIterator: GroupIterator;
export default GroupIterator;