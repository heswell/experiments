import { DataType } from '../store/types';
import { sortColumn, SubscriptionOptions } from './data-source';

declare class LocalDataSource {
  constructor(config: any);

  filter: (filter: any, dataType: string, incremental: boolean) => void;
  group: (groupBy: sortColumn[]) => void;
  setRange: (lo: number, hi: number, dataType?: DataType) => void;
  subscribe: (options: SubscriptionOptions, callback:() => void) => Promise<void>;
  select: (idx: number, rangeSelect: boolean, keepExistingSelection: boolean) => void;
  setGroupState: (groupState: any) => void;
  size: number;
  sort: (sortBy: sortColumn[]) => void;
  unsubscribe: () => void;
}

export default LocalDataSource;
