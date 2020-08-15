// @ts-check

import {createLogger, DataTypes, EventEmitter, logColor} from '@heswell/utils'
import {DataStore as DataView, Table} from '@heswell/data-store';
import LocalUpdateQueue from './local-update-queue';

const {ROW_DATA} = DataTypes;

const buildDataView = async url => {
  console.log(`import url ${url}`)
  return import(/* webpackIgnore: true */ url)
    .catch(err => console.log(`failed to load data at ${url} ${err}`))
}

const loadData = data => {
  return Promise.resolve({default: data});
}

const logger = createLogger('LocalDataSource', logColor.blue);

export default class LocalDataSource extends EventEmitter {
  constructor({
    data,
    primaryKey,
    url,
    tableName
  }) {
    super();
    this.eventualView = 
      url ? buildDataView(url) :
      data ? loadData(data) :
      Promise.reject('bad params');

    this.columns = null;
    this.primaryKey = primaryKey;

    this.tableName = tableName;
    this.subscription = null;
    this.viewport = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;

    this.updateQueue = new LocalUpdateQueue();
    this.dataStore = null;
    this.clientCallback = null;

    this.pendingRangeRequest = null;
    this.pendingFilterColumn= null;
    this.pendingFilterRange = null;
  }

  async subscribe({
    tableName = this.tableName,
    columns = this.columns,
    range
    // TODO support groupBy, sort etc
  }, callback) {

    if (!columns) throw Error("LocalDataView subscribe called without columns");
    
    // TODO options can include sort, groupBy etc
    
    this.tableName = tableName;
    this.columns = columns;
    const { default: data } = await this.eventualView
    const table = new Table({ data, columns, primaryKey: this.primaryKey });
    this.dataStore = new DataView(table, {columns}, this.updateQueue);
    this.clientCallback = callback;

    this.updateQueue.on(DataTypes.ROW_DATA, (evtName, message) => callback(message));

    if (this.pendingFilterColumn){
      this.getFilterData(this.pendingFilterColumn, this.pendingFilterRange);
      this.pendingFilterColumn = null;
      this.pendingFilterRange = null;
    }

    callback({type: 'subscribed', columns});

    if (range){
      this.setRange(range.lo, range.hi);
    }

  }

  unsubscribe() {
    console.log('LocalDataSource unsubscribe');
    this.clientCallback = null;
    this.dataStore.destroy();
    this.updateQueue.removeAllListeners(DataTypes.ROW_DATA);
    this.dataStore = null;
  }

  subscribeToFilterData(column, range, callback) {
    logger.log(`direct call to <subscribeToFilterData>`)
    this.clientFilterCallback = callback;
    this.getFilterData(column, range);
  }

  unsubscribeFromFilterData() {
    logger.log(`<unsubscribeFromFilterData>`)
    this.clientFilterCallback = null;
  }

  // This is a bit odd - we should call this setSchema
  setColumns(columns){
    this.columns = columns;
    return this;
  }

  // Maybe we just need a modify subscription
  setSubscribedColumns(columns){
    if (columns.length !== this.columns.length || !columns.every(columnName => this.columns.includes(columnName))){
      this.columns = columns;
      this.dataStore.setSubscribedColumns(columns);
    }
  }

  setRange(lo, hi, dataType=ROW_DATA) {
    if (this.dataStore === null){
      this.pendingRangeRequest = [lo,hi, dataType]
    } else {
      const result = this.dataStore.setRange({lo, hi}, true, dataType);
      if (dataType === ROW_DATA){
        this.clientCallback(result);
      } else {
        this.clientFilterCallback(result);
      }
    }
  }

  select(idx, rangeSelect, keepExistingSelection, dataType=ROW_DATA) {
    const result = this.dataStore.select(idx, rangeSelect, keepExistingSelection, dataType);
    dataType === ROW_DATA
      ? this.clientCallback(result)
      : this.clientFilterCallback(result);
  }

  selectAll(dataType=ROW_DATA){
    const result = this.dataStore.selectAll(dataType);
    dataType === ROW_DATA
      ? this.clientCallback(result)
      : this.clientFilterCallback(result);
  }

  selectNone(dataType=ROW_DATA){
    const result = this.dataStore.selectNone(dataType);
    dataType === ROW_DATA
      ? this.clientCallback(result)
      : this.clientFilterCallback(result);
  }

  filter(filter, dataType = ROW_DATA, incremental = false) {
    const [rowData, filterData] = this.dataStore.filter(filter, dataType, incremental);
    if (rowData){
      this.clientCallback(rowData);
    }
    if (filterData && this.clientFilterCallback){
      this.clientFilterCallback(filterData);
    }
  }

  group(columns) {
    if (this.clientCallback){
      this.clientCallback(this.dataStore.groupBy(columns))
    } else if (this.dataStore){
      this.dataStore.groupBy(columns);
    }
  }

  setGroupState(groupState) {
    if (this.clientCallback){
      this.clientCallback(this.dataStore.setGroupState(groupState))
    } else if (this.dataStore){
      this.dataStore.setGroupState(groupState);
    }
  }

  sort(columns) {
    console.log(columns)
    if (this.clientCallback){
      this.clientCallback(this.dataStore.sort(columns));
    } else if (this.dataStore){
      this.dataStore.sort(columns);
    }
  }


  getFilterData(column, range) {
    logger.log(`getFilterData column=${column.name} range ${JSON.stringify(range)}`)
      if (this.dataStore){
        logger.log(`getFilterData, dataView exists`)
        const filterData =  this.dataStore.getFilterData(column, range);
        this.clientFilterCallback(filterData);
      } else {
        this.pendingFilterColumn = column;
        this.pendingFilterRange = range;
      }
  }
}

