import { DataSource } from './data-source';
import { Column } from '@heswell/ingrid';
import { EventEmitter, Stats } from './filter-data-source';

type Events = {
  'data-count': Stats
}

declare class BinnedDataSource extends EventEmitter<Events> {
  constructor(dataSource: DataSource, column: Column);
}
export default BinnedDataSource;