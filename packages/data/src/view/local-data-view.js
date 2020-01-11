import {createLogger, logColor} from '@heswell/utils'
import DataView from '../store/data-view';
import { metaData } from '../store/columnUtils';
import { DataTypes } from '../store/types';
import Table from '../store/table';
import LocalUpdateQueue from '../store/local-update-queue';

const {ROW_DATA} = DataTypes;

const buildDataView = async url => {
  console.log(`import url ${url}`)
  return import(/* webpackIgnore: true */ url)
    .catch(err => console.log(`failed to load data at ${url} ${err}`))
}

const logger = createLogger('LocalDataView', logColor.blue);

export default class LocalDataView {
  constructor({
    url,
    tableName
  }) {

    this.eventualView = buildDataView(url);
    this.columns = null;
    this.meta = null;

    this.tableName = tableName;
    this.subscription = null;
    this.viewport = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;

    this.updateQueue = new LocalUpdateQueue();
    this.dataView = null;
    this.clientCallback = null;

    this.pendingRangeRequest = null;
    this.pendingFilterColumn= null;
    this.pendingFilterRange = null;
  }

  async subscribe({
    tableName = this.tableName,
    columns
    // TODO support groupBy, sort etc
  }, callback) {

    if (!columns) throw Error("LocalDataView subscribe called without columns");
    
    // TODO options can include sort, groupBy etc
    
    this.tableName = tableName;
    this.columns = columns;
    this.meta = metaData(columns);

    console.log(`subscribe, wait for data`)
    const { default: data } = await this.eventualView
    const table = new Table({ data, columns });
    this.dataView = new DataView(table, {columns}, this.updateQueue);
    console.log(`got data, dataView is assigned`)
    this.clientCallback = callback;

    this.updateQueue.on(DataTypes.ROW_DATA, (evtName, message) => callback(message));

    if (this.pendingFilterColumn){
      console.log(`gor a pending filter requerst for ${this.pendingFilterColumn.name}`)
      this.getFilterData(this.pendingFilterColumn, this.pendingFilterRange);
      this.pendingFilterColumn = null;
      this.pendingFilterRange = null;
    }

    //TODO can we eliminate all the following ?
    if (this.pendingRangeRequest){
      this.setRange(...this.pendingRangeRequest);
      this.pendingRangeRequest = null;
    }

  }

  unsubscribe() {

  }

  subscribeToFilterData(column, range, callback) {
    logger.log(`<subscribeToFilterData>`)
    this.clientFilterCallback = callback;
    this.getFilterData(column, range);
  }

  unsubscribeFromFilterData() {
    logger.log(`<unsubscribeFromFilterData>`)
    this.clientFilterCallback = null;
  }

  setRange(lo, hi, dataType=ROW_DATA) {
    if (this.dataView === null){
      this.pendingRangeRequest = [lo,hi, dataType]
    } else {
      const result = this.dataView.setRange({lo, hi}, true, dataType);
      if (dataType === ROW_DATA){
        this.clientCallback(result);
      } else {
        this.clientFilterCallback(result);
      }
    }
  }

  select(idx, rangeSelect, keepExistingSelection, dataType=ROW_DATA) {
    const result = this.dataView.select(idx, rangeSelect, keepExistingSelection, dataType);
    dataType === ROW_DATA
      ? this.clientCallback(result)
      : this.clientFilterCallback(result);
  }

  selectAll(dataType=ROW_DATA){
    const result = this.dataView.selectAll(dataType);
    dataType === ROW_DATA
      ? this.clientCallback(result)
      : this.clientFilterCallback(result);
  }

  selectNone(dataType=ROW_DATA){
    const result = this.dataView.selectNone(dataType);
    dataType === ROW_DATA
      ? this.clientCallback(result)
      : this.clientFilterCallback(result);
  }

  filter(filter, dataType = ROW_DATA, incremental = false) {
    const [rowData, filterData] = this.dataView.filter(filter, dataType, incremental);
    if (rowData){
      this.clientCallback(rowData);
    }
    if (filterData && this.clientFilterCallback){
      this.clientFilterCallback(filterData);
    }
  }

  group(columns) {
    this.clientCallback(this.dataView.groupBy(columns))
  }

  setGroupState(groupState) {
    this.clientCallback(this.dataView.setGroupState(groupState))
  }

  sort(columns) {
    this.clientCallback(this.dataView.sort(columns));
  }


  getFilterData(column, range) {
      if (this.dataView){
        const filterData =  this.dataView.getFilterData(column, range);
        this.clientFilterCallback(filterData);
      } else {
        this.pendingFilterColumn = column;
        this.pendingFilterRange = range;
      }
  }
}