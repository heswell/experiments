import { DataTypes, columnUtils } from '@heswell/data';
import {uuid, createLogger, logColor} from '@heswell/utils';
import {
  msgType as Msg,
  connectionId as _connectionId,
} from './constants';

// TODO make this dynamic
import ConnectionManager from './connection-manager';

const { metaData } = columnUtils;
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
export default class RemoteDataView  {

  constructor({tableName, serverName = AvailableProxies.Viewserver, url}) {

    this.url = url;
    this.serverName = serverName;
    this.tableName = tableName;

    this.server = NullServer;  
    this.columns = null;
    this.meta = null;
    this.subscription = null;
    this.viewport = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;
  }

  async subscribe({
    viewport = uuid(),
    tableName = this.tableName,
    columns,
    range = defaultRange
  }, callback) {

    if (!tableName) throw Error("RemoteDataView subscribe called without table name");
    if (!columns) throw Error("RemoteDataView subscribe called without columns");

    this.viewport = viewport;
    this.tableName = tableName;
    this.columns = columns;
    this.meta = metaData(columns);
    logger.log(`range = ${JSON.stringify(range)}`)

    this.server = await ConnectionManager.connect(this.url, this.serverName);

    this.server.subscribe({
        viewport,
        tablename: tableName,
        columns,
        range
      }, message => {
          const { filterData/*, data, updates*/ } = message;
          if (filterData && this.filterDataCallback) {
            this.filterDataCallback(message)
          } else {
            callback(message)
          }
      });

    // could we pass all this into the call above ?
    // this.subscription = subscribe({
    //   ...options,
    //   viewport,
    //   tablename: tableName,
    //   columns,
    //   range
    // }, /* postMessageToClient */(message) => {

    //   const { filterData, data, updates } = message;
    //   if ((data && data.rows) || updates) {
    //     callback(data || message);
    //   } else if (filterData && this.filterDataCallback) {
    //     this.filterDataCallback(message)
    //   } else if (filterData) {
    //     // experiment - need to store the column as well
    //     this.filterDataMessage = message;
    //   } else if (data && data.selected){
    //     // TODO think about this
    //     const {selected, deselected} = data;
    //     callback({range, selected, deselected});
    //   }

    // });

  }

  unsubscribe() {

  }

  setRange(lo, hi) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.setViewRange,
      range: { lo, hi },
      dataType: DataTypes.ROW_DATA
    });
  }

  select(idx, _row, rangeSelect, keepExistingSelection){
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.select,
      idx,
      rangeSelect,
      keepExistingSelection
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

  filter(filter, dataType = DataTypes.ROW_DATA, incremental=false) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.filter,
      dataType,
      filter,
      incremental
    })
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
    this.setFilterRange(range.lo, range.hi);
    if (this.filterDataMessage) {
      callback(this.filterDataMessage);
      // do we need to nullify now ?
    }

  }

  unsubscribeFromFilterData() {
    logger.log(`<unsubscribeFromFilterData>`)
    this.filterDataCallback = null;
  }

  // To support multiple open filters, we need a column here
  setFilterRange(lo, hi) {
    console.log(`setFilerRange ${lo}:${hi}`)
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: Msg.setViewRange,
      dataType: DataTypes.FILTER_DATA,
      range: { lo, hi }
    })

  }

}

