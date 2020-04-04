import {DataSource} from '@heswell/data'
import {Column} from '../../model/model';

declare const DataSourceFactory: (dataSource: DataSource, filterType: any, column: Column, statsHandler: any) => DataSource;

export default DataSourceFactory;