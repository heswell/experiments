// @ts-nocheck
import perspective from '@finos/perspective';

import {createLogger, DataTypes, EventEmitter, logColor, metadataKeys } from '@heswell/utils'
import LocalUpdateQueue from './local-update-queue';

const {ROW_DATA} = DataTypes;

const logger = createLogger('LocalDataSource', logColor.blue);

function buildPivotColumns(groupBy, pivotBy, columns){
  console.log(`buildPivotColumns
    groupBy ${groupBy ? groupBy.join(',') : ''}
    pivotBy ${pivotBy ? pivotBy.join(',') : ''}
  `, columns)
  return columns.map(path => {
    const heading = path.split('|').reverse();
    return {
      name: heading[0],
      heading
    }
  })
}

const perspectiveType = type => {
  switch(type){
    case 'number': return 'float';
    default: return type || 'string';
  }
}

const convertToPSPSchema = columns => {
  return columns.reduce((map, column) => {
    map[column.name] = perspectiveType(column.type)
    return map;
  },{});
}

const rowsFromColumns = (data, columns, groupColumns, pivotColumns, idx) => {
  const {count: metadataOffset, DEPTH, COUNT} = metadataKeys;
  let rowIdx = idx;
  const dataColumns = Object.keys(data);
  const count = data[dataColumns[0]].length;
  const results = Array(count);
  for (let i=0;i<count;i++){
    results[i] = [rowIdx+i,0,0,rowIdx+i];
    for (let j=0;j<columns.length;j++){
      const columnName = columns[j];
      if (data[columnName]){
        results[i][metadataOffset+j] = data[columnName][i];
      }
    }
    if (data.__ROW_PATH__){
      const path = data.__ROW_PATH__[i];
      if (path.length){
        results[i][DEPTH] = groupColumns.length - path.length + 1
        for (let k=0;k<path.length;k++){
          const colName = groupColumns[k];
          if (data[colName]){
            const colIdx = columns.indexOf(colName);
            results[i][metadataOffset + colIdx] = path[k];
            results[i][COUNT] = data[colName][i];
          }
        }
      }
    }
  }
  return results;
}

export default class PerspectiveDataSource extends EventEmitter {
  constructor({
    columns,
    table,
    configUrl
  }) {
    super();

    this.table = table;
    this.view = null;

    // TODO think this through, put in as quick solution for perspective
    this.features = {
      expand_level_1: false
    }

    this.columns = columns;
    this.columnNames = columns.map(c=>c.name)

    this.range = null;
    this.subscription = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;

    this.sortyBy = undefined;
    this.groupBy = undefined;
    this.pivotBy = undefined;

    // do we need this ?
    this.updateQueue = new LocalUpdateQueue();
    this.dataStore = null;
    this.clientCallback = null;

    this.pendingRangeRequest = null;
    this.pendingFilterColumn= null;
    this.pendingFilterRange = null;


    console.log(`about to load configUrl ${configUrl}`)
    const loadConfig = async () => await import(/* webpackIgnore: true */ configUrl);
    this.eventualConfig = loadConfig();

  }

  async subscribe({
    columns = this.columns,
    range
    // TODO support groupBy, sort etc
  }, callback) {

    if (!columns) throw Error("LocalDataView subscribe called without columns");
    
    const {config} = await this.eventualConfig;
    const {generateData} = await import(/* webpackIgnore: true */ config.dataUrl);
    const schema = convertToPSPSchema(config.columns)

    const table = perspective.worker().table( schema,  { limit: 5000 });
    table.update(generateData());

    const view = await table.view({
      columns: columns.map(c => c.name)
    });
    view.on_update(() => this.update());  

    this.columns = columns;
    this.table = table;
    this.view = view;
    this.generateData = generateData;
    this.clientCallback = callback;


    // this.updateQueue.on(DataTypes.ROW_DATA, (evtName, message) => callback(message));

    // if (this.pendingFilterColumn){
    //   this.getFilterData(this.pendingFilterColumn, this.pendingFilterRange);
    //   this.pendingFilterColumn = null;
    //   this.pendingFilterRange = null;
    // }

    callback({type: 'subscribed', columns});

    if (range){
      this.setRange(range.lo, range.hi);
    }

  }

  async update(){
    const {lo, hi} = this.range;
    const [columns,size] = await Promise.all([this.view.to_columns({start_row: lo, end_row: hi}), this.view.num_rows()]);

    const rows = rowsFromColumns(columns, this.columnNames, this.groupBy, this.pivotBy, lo);
    this.clientCallback({
      rows,
      range: this.range,
      size
    });
  } 

  async createView(){
    if (this.view){
      this.view.delete();
    }

    this.view = await this.table.view({
      columns: this.columnNames,
      column_pivots: this.pivotBy,
      row_pivots: this.groupBy,
      sort: this.sortBy
    });

    this.view.on_update(() => this.update());  

  }

  async pushDataToClient(){
    const {columnNames, groupBy, pivotBy, range, view} = this;
    const [columns,size] = await Promise.all([view.to_columns({start_row: range.lo, end_row: range.hi}), view.num_rows()]);
    const rows = rowsFromColumns(columns, columnNames, groupBy, pivotBy, range.lo);
    this.clientCallback({ rows, range, size });
  }

  unsubscribe() {
    console.log('LocalDataSource unsubscribe');
    this.clientCallback = null;
    if (this.view){
      // TODO does delete clean up the update listener ?
      this.view.delete();
      this.view = null;
    }
    this.updateQueue.removeAllListeners(DataTypes.ROW_DATA);
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

  setColumnNames(columns){
    this.columnNames = columns;
    return this;
  }

  // Maybe we just need a modify subscription
  setSubscribedColumns(columns){
    // if (columns.length !== this.columns.length || !columns.every(columnName => this.columns.includes(columnName))){
    //   this.columns = columns;
    //   if (this.dataStore !== null){
    //     this.dataStore.setSubscribedColumns(columns);
    //   }
    // }
  }

  async setRange(lo, hi, dataType=ROW_DATA) {
    if (this.view === null){
      this.pendingRangeRequest = [lo,hi, dataType];
    } else {
      this.range = {lo,hi};
      this.pushDataToClient();
    }
  }

  async group(groupColumns, pivotColumns) {
    const {groupBy, pivotBy} = this;
    this.groupBy = groupColumns ? groupColumns.map(([columnName]) => columnName) : undefined;
    this.pivotBy = pivotColumns ? pivotColumns.map(([columnName]) => columnName): undefined;
    const pivotAdded = this.pivotBy && !pivotBy; // or if pivot column added

    if (pivotAdded){
      this.columnNames = this.columnNames.filter(columnName => !this.pivotBy.includes(columnName));
    }
   
    await this.createView();

    if (pivotAdded){
      const columns = await this.view.column_paths();
      this.clientCallback({type: 'pivot', columns: buildPivotColumns(this.groupBy, this.pivotBy, columns)});
      this.columnNames = columns;
   }

    if (this.range){
      this.pushDataToClient();
    }

  }

  async sort(columns) {
    console.log(columns);
    this.sortBy = columns.map(([name, dir]) => ([name, dir === 'dsc' ? 'desc' : 'asc']));

    await this.createView();

    if (this.range){
      this.pushDataToClient();
    }

  }

  async setGroupState(groupState) {

    if (this.view){
      const {rowIdx} = groupState;
      const isExpanded = await this.view.get_row_expanded(rowIdx);
      if (isExpanded){
        await this.view.collapse(rowIdx);
      } else {
        await this.view.expand(rowIdx);
      }

      this.pushDataToClient();
 
    } else {
      console.log('couldne expand group state', groupState)
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

  startStressTest(){
    console.log(`PSP startStressTest`)

  }

  startLoadTest(){
    this.test_count = 0;
    const {table} = this;

    const update = () => {
      this.test_count += 1;
      table.update(this.generateData());
      if (this.test_count < 1000){
        setTimeout(update, 30)
      }
    }
    setTimeout(update, 30);
  }

  stopTest(){
    this.test_count = 1001;
  }

  
}

