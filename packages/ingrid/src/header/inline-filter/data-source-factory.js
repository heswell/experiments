
// @ts-check
/**
 * @typedef {import('./data-source-factory').default} DataSourceFactory
 */
import { 
  BinnedDataSource,
  FilterDataSource,
  filter as filterUtils
} from '@heswell/data';

import { FilterType } from '@heswell/ingrid-extras';

const ZeroRowFilter = {
  colName: 'count',
  type: filterUtils.NOT_IN,
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