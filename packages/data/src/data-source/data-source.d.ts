import {DataType} from '../store/types';
import {Column} from '@heswell/ingrid';

type sortDirection = 'asc' | 'dsc';
type sortColumn = [string, sortDirection];

export interface SubscriptionOptions {
  columns: Column[];
  range?: Range;
}

interface Range {
  lo: number;
  hi: number;
}

export interface DataSource {
  filter: (filter: any, dataType?: string, incremental?: boolean) => void;
  group: (groupBy: sortColumn[]) => void;
  setRange: (lo: number, hi: number, dataType?: DataType) => void;
  subscribe: (options: SubscriptionOptions, callback:() => void) => Promise<void>;
  select: (idx: number, rangeSelect: boolean, keepExistingSelection: boolean) => void;
  setGroupState: (groupState: any) => void;
  size: number;
  sort: (sortBy: sortColumn[]) => void;
  unsubscribe: () => void;
}
