
// @ts-check
/**
 * @typedef {import('./data-source-factory').default} DataSourceFactory
 */
import { 
  BinnedDataSource,
  FilterDataSource
} from '@heswell/data';

import { NOT_IN } from '@heswell/utils';
import { FilterType } from '@heswell/ingrid-extras';

const ZeroRowFilter = {
  colName: 'count',
  type: NOT_IN,
  values: [0]
}

/** @type {DataSourceFactory} */
const dataSourceFactory = (dataView, filterType, column, statsHandler) => {
  const filterView = filterType === FilterType.Set
    ? new FilterDataSource(dataView, column, {filter: ZeroRowFilter})
    : filterType === FilterType.Number
      ? new BinnedDataSource(dataView, column)
      : null

  filterView.on('data-count', statsHandler);
  return filterView;
}

export default dataSourceFactory;