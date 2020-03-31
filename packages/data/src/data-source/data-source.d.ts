export interface DataSource {
  group: (groupBy: any) => void;
  setRange: (lo: number, hi: number, dataType?: string) => void;
  async subscribe: (config: any, callback:() => void) => void;
  select: (idx: number, rangeSelect: boolean, keepExistingSelection: boolean) => void;
  setGroupState: (groupState: any) => void;
  size: number;
  sort: (sortBy: any) => void;
  unsubscribe: () => void;
}

export declare class LocalDataSource implements DataSource {
  constructor(config: any);
  async subscribe: (config: any, callback:() => void) => void;
}

export declare class FilterDataSource implements DataSource {
  constructor(config: any, column: any);
}
