// @ts-nocheck
import perspective from '@finos/perspective';

import {createLogger, DataTypes, EventEmitter, logColor } from '@heswell/utils'
import * as utils from './perspective-utils';

const {ROW_DATA} = DataTypes;

const logger = createLogger('LocalDataSource', logColor.blue);

function buildPivotColumns(groupBy, pivotBy, columns){

  console.log(`buildPivotColumns
    groupBy ${groupBy ? groupBy.join(',') : ''}
    pivotBy ${pivotBy ? pivotBy.join(',') : ''}
  `, columns);

  return columns.reduce((list,path) => {
    const heading = path.split('|').reverse();
    const [colName] = heading;
    if (colName === '__ROW_PATH__'){
      groupBy.forEach(name => {
        list.push({name, heading: [name]});
      })
    } else if (!groupBy || !groupBy.includes(colName)){
      list.push({
        name: colName,
        heading
      });
    }
    return list;
  },[])
}

export default class PerspectiveDataSource extends EventEmitter {
  constructor({
    table,
    configUrl,
    dataUrl
  }) {
    super();

    this.table = table;
    this.view = null;

    // TODO think this through, put in as quick solution for perspective
    this.features = {
      expand_level_1: false
    }

    this.columns = undefined;
    this.columnNames = undefined;

    this.range = null;
    this.subscription = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;

    this.sortyBy = undefined;
    this.groupBy = undefined;
    this.pivotBy = undefined;

    this.dataStore = null;
    this.clientCallback = null;
    this.status = 'initialising';

    this.pendingRangeRequest = null;
    this.pendingFilterColumn= null;
    this.pendingFilterRange = null;

    this.readyToSubscribe = configUrl
      ? this.loadFromConfig(configUrl)
      : this.loadFromArrow(dataUrl)

  }

  loadFromConfig(configUrl){
    return new Promise(resolve => {
      const loadConfig = async () => await import(/* webpackIgnore: true */ configUrl);
      loadConfig().then(async ({config: {columns, dataUrl}}) => {
        const {generateData} = await import(/* webpackIgnore: true */ dataUrl);
        const schema = utils.convertToPSPSchema(columns);
        this.table = perspective.worker().table( schema,  { limit: 5000 });
        this.table.update(generateData());
        this.generateData = generateData;
        this.columns = columns;
        this.columnNames = this.columns.map(c=>c.name)
        this.status = 'ready';
        resolve();
      })
    });
  }

  loadFromArrow(dataUrl){
    return new Promise(async (resolve) => {
      const data = await fetch(dataUrl);
      const arrayBuffer = await data.arrayBuffer();
      this.table = perspective.worker().table(arrayBuffer);
      const schema = await this.table.schema(false);
      this.columns = utils.convertFromPSPSchema(schema);
      this.columnNames = this.columns.map(c=>c.name)
      resolve();
    })
  }

  async subscribe({
    range
    // TODO support groupBy, sort etc
  }, callback) {

    await this.readyToSubscribe;

    console.log(`create view with columns ${this.columnNames.join(',')}`)
    const view = await this.table.view({
      columns: this.columnNames
    });
    view.on_update(() => this.update());  

    this.view = view;
    this.clientCallback = callback;

    callback({type: 'subscribed', columns: this.columns});

    if (range){
      this.setRange(range.lo, range.hi);
    }

  }

  async update(){
    const {lo, hi} = this.range;
    const [columns,size] = await Promise.all([this.view.to_columns({start_row: lo, end_row: hi}), this.view.num_rows()]);

    const rows = utils.rowsFromColumns(columns, this.columnNames, this.groupBy, this.pivotBy, lo);
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
    const rows = utils.rowsFromColumns(columns, columnNames, groupBy, pivotBy, range.lo);
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

  setColumnNames(columns){
    this.columnNames = columns;
    return this;
  }

  // Maybe we just need a modify subscription
  async setSubscribedColumns(columns){
    this.columnNames = columns;  
    if (this.status === 'ready'){
      await this.createView();
      if (this.range){
        this.pushDataToClient();
      }
    } else {
      console.log('not ready but weve set columnNames')
    }
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
    const pivotAdded = this.pivotBy && !pivotBy; // what about if pivot column added

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

