import {createLogger, DataTypes, EventEmitter, logColor, uuid} from '@heswell/utils';
import {
  msgType as Msg,
  connectionId as _connectionId,
} from './constants';

// TODO make this dynamic
import ConnectionManager from './connection-manager';

const {ROW_DATA} = DataTypes;

const logger = createLogger('RemoteDataView', logColor.blue);

export const AvailableProxies = {
  Viewserver: 'viewserver', 
  Vuu: 'vuu'
}

const NullServer = {
  handleMessageFromClient: message => console.log(`%cNullServer.handleMessageFromClient ${JSON.stringify(message)}`,'color:red')
}

const defaultRange = { lo: 0, hi: 0 };

/*-----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
export default class RemoteDataSource  extends EventEmitter {

  constructor({tableName, serverName = AvailableProxies.Viewserver, url}) {
    super();
    this.url = url;
    this.serverName = serverName;
    this.tableName = tableName;
    this.server = NullServer;  
    this.columns = null;
    this.subscription = null;
    this.viewport = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;
  }

  async subscribe({
    viewport = uuid(),
    tableName = this.tableName,
    columns=this.columns || [],
    range = defaultRange
  }, callback) {

    if (!tableName) throw Error("RemoteDataSource subscribe called without table name");
    // if (!columns) throw Error("RemoteDataSource subscribe called without columns");

    this.viewport = viewport;
    this.tableName = tableName;
    this.columns = columns;
    logger.log(`subscribe to ${tableName} range = ${JSON.stringify(range)}`)

    this.server = await ConnectionManager.connect(this.url, this.serverName);

    this.server.subscribe({
        viewport,
        tablename: tableName,
        columns: columns.map(column => column.name),
        range
      }, message => {
          if (message.dataType === DataTypes.FILTER_DATA) {
            this.filterDataCallback(message)
          } else {
            callback(message)
          }
      });
  }

  unsubscribe() {
    logger.log(`unsubscribe from ${this.tableName} (viewport ${this.viewport})`);
    this.server.unsubscribe(this.viewport);
    this.server.destroy();
  }

  setColumns(columns){
    this.columns = columns;
    return this;
  }

  setSubscribedColumns(columns){
    if (columns.length !== this.columns.length || !columns.every(columnName => this.columns.includes(columnName))){
      this.columns = columns;
      // ???
    }
  }


  setRange(lo, hi, dataType=ROW_DATA) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.setViewRange,
      range: { lo, hi },
      dataType
    });
  }

  select(idx, rangeSelect, keepExistingSelection, dataType=ROW_DATA){
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.select,
      idx,
      rangeSelect,
      keepExistingSelection,
      dataType
    });
  }

  selectAll(dataType=ROW_DATA){
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.selectAll,
      dataType
    });
  }

  selectNone(dataType=ROW_DATA){
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.selectNone,
      dataType
    });

  }

  filter(filter, dataType = ROW_DATA, incremental=false) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.filter,
      filter,
      incremental,
      dataType,
    })
  }

  group(columns) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.groupBy,
      groupBy: columns
    });
  }

  setGroupState(groupState) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.setGroupState,
      groupState
    });
  }

  sort(columns) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.sort,
      sortCriteria: columns
    });
  }

  getFilterData(column, searchText) {
    console.log(`[RemoteDataView] getFilterData`)
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.getFilterData,
      column,
      searchText
    });
  }

  subscribeToFilterData(column, range, callback) {
    logger.log(`<subscribeToFilterData> ${column.name}`)
    this.filterDataCallback = callback;
    this.getFilterData(column, range);

    // this.setFilterRange(range.lo, range.hi);
    // if (this.filterDataMessage) {
    //   callback(this.filterDataMessage);
    //   // do we need to nullify now ?
    // }

  }

  unsubscribeFromFilterData() {
    logger.log(`<unsubscribeFromFilterData>`)
    this.filterDataCallback = null;
  }

  // // To support multiple open filters, we need a column here
  // setFilterRange(lo, hi) {
  //   console.log(`setFilerRange ${lo}:${hi}`)
  //   this.server.handleMessageFromClient({
  //     viewport: this.viewport,
  //     type: Msg.setViewRange,
  //     dataType: DataTypes.FILTER_DATA,
  //     range: { lo, hi }
  //   })

  // }

}

