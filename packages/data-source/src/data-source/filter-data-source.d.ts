import { DataSource, SubscriptionOptions } from './data-source';

export interface Stats {
  totalRowCount: number;
  filteredRowCount: number;
  filteredSelected: number;
}


// TODO move to utils
export declare class EventEmitter<Events> {
  on: <E extends keyof Events>(event: E, callback: (E, arg: Events[E]) => void) => void; 
  emit: <E extends keyof Events>(event: E, arg: Events[E]) => void;
}

type Events = {
  'data-count': Stats
}

declare class FilterDataSource extends EventEmitter<Events> {
  constructor(dataSource: DataSource, column: any, options: any);
  group: (groupBy: any) => void;
  setRange: (lo: number, hi: number, dataType?: any) => void;
  subscribe: (options: SubscriptionOptions, callback:() => void) => Promise<void>;
  select: (idx: number, rangeSelect: boolean, keepExistingSelection: boolean) => void;
  setGroupState: (groupState: any) => void;
  size: number;
  sort: (sortBy: any) => void;
  unsubscribe: () => void;
  filter: (filter: any, dataType: string, incremental: boolean) => void;
}

export default FilterDataSource;
