import { DataSource } from './data-source';
import { Column } from '@heswell/ingrid';

export interface Stats {
  totalRowCount: number;
  filteredRowCount: number;
  filteredSelected: number;
}


// TODO move to utils
declare class EventEmitter<Events> {
  on: <E extends keyof Events>(event: E, callback: (E, arg: Events[E]) => void) => void; 
  emit: <E extends keyof Events>(event: E, arg: Events[E]) => void;
}

type Events = {
  'data-count': Stats
}

declare class FilterDataSource extends EventEmitter<Events> {
  constructor(dataSource: DataSource, column: Column);
  group: (groupBy: any) => void;
  setRange: (lo: number, hi: number, dataType?: DataType) => void;
  async subscribe: (options: SubscriptionOptions, callback:() => void) => Promise<void>;
  select: (idx: number, rangeSelect: boolean, keepExistingSelection: boolean) => void;
  setGroupState: (groupState: any) => void;
  size: number;
  sort: (sortBy: any) => void;
  unsubscribe: () => void;
  filter: (filter: any, dataType: string, incremental: boolean) => void;
}

export default FilterDataSource;