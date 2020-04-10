import {DataSource} from '@heswell/data-source'
import {Column} from '../../model/model';

declare const DataSourceFactory: (dataSource: DataSource, filterType: any, column: Column, statsHandler: any) => DataSource;

export default DataSourceFactory;