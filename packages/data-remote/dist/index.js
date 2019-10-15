import { DataTypes, columnUtils } from '@heswell/data';
import { createLogger, logColor, EventEmitter, uuid } from '@heswell/utils';

let _connectionId = 0;

const connectionId = {
  get nextValue(){
    return _connectionId++;
  }
};

const msgType = {
  connect : 'connect',
  connectionStatus : 'connection-status',
  getFilterData : 'GetFilterData',
  rowData : 'rowData',
  rowSet: 'rowset',
  select : 'select',
  selected: 'selected',
  snapshot : 'snapshot',
  update: 'update',

  addSubscription: 'AddSubscription',
  collapseGroup : 'CollapseGroup',
  columnList : 'ColumnList',
  data : 'data',
  expandGroup : 'ExpandGroup',
  filter : 'filter',
  filterData : 'filterData',
  getSearchData : 'GetSearchData',
  groupBy : 'groupBy',
  modifySubscription : 'ModifySubscription',
  searchData : 'searchData',
  setColumns: 'setColumns',
  setGroupState : 'setGroupState',
  setViewRange : 'setViewRange',
  size : 'size',
  sort : 'sort',
  subscribed : 'Subscribed',
  tableList : 'TableList',
  unsubscribe : 'TerminateSubscription',
  viewRangeChanged : 'ViewRangeChanged',
};

class Connection {

  static connect(connectionString, callback, connectionStatusCallback) {
    return new Promise(function (resolve) {
        let connected = false;
        const connection = new Connection(connectionString, msg => {
          const {type} = msg;
          // TODO check the connection status is actually connected
          if (type === 'connection-status'){
            connectionStatusCallback(msg);
            if (msg.status === 'connected' && !connected){
              connected = true;
              resolve(connection);
            }
          } else if (type === 'HB'){
              console.log(`swallowing HB in WebsocketConnection`);
          } else {
            callback(msg);
          }
        });
    });
  }

  constructor(connectionString, callback) {
      const ws = new WebSocket('ws://' + connectionString);
      ws.onopen = () => {
        console.log('%c⚡','font-size: 24px;color: green;font-weight: bold;');
        callback({type : 'connection-status',  status: 'connected' });
      };

      ws.onmessage = evt => {
        const message = JSON.parse(evt.data);
        // console.log(`%c<<< [${new Date().toISOString().slice(11,23)}]  (WebSocket) ${message.type || JSON.stringify(message)}`,'color:white;background-color:blue;font-weight:bold;');
        if (Array.isArray(message)){
          message.map(callback);
        } else {
          callback(message);
        }
      };

      ws.onerror = evt => {
        console.error(`websocket error`, evt);
        callback({type: 'connection-status', status: 'disconnected', reason: 'error'});
      };
      ws.onclose = evt => {
        console.warn(`websocket closed`, evt);
        callback({type: 'connection-status', status: 'disconnected', reason: 'close'});
      };
      this.send = message => ws.send(JSON.stringify(message));
  }
}

const serverProxies = new WeakMap();
const servers = new WeakMap();

const logger = createLogger('ConnectionManager', logColor.blue);

const getServerProxy = async serverName => {
  console.log(`request for proxy class for ${serverName}`,serverProxies[serverName]);

  return serverProxies[serverName] || (serverProxies[serverName] =
    import(/* webpackIgnore: true */`./server-proxy/${serverName}.js`));
};
const getServer = async (serverName, url) => {
  logger.log(`request for server at ${url} ... `);
  
  return servers[url] || (servers[url] = new Promise(async (resolve, reject) => {
    const {ServerProxy} = await getServerProxy(serverName);
    if (ServerProxy){
      logger.log(`...resolved server at ${url}`);
      resolve(new ServerProxy());
    } else {
      reject('Unable to load class ServerProxy for server ${serverName}');
    }
  }))
};
  
class ConnectionManager extends EventEmitter {

  async connect(url, serverName){
    logger.log(`ConnectionManager.connect ${serverName} ${url}`);
    const server = await getServer(serverName, url);
    if (server.connection === null){
      const connection = await Connection.connect(
        url, 
        msg => server.handleMessageFromServer(msg),
        msg => this.onConnectionStatusChanged(serverName, url, msg)
      );
      server.connection = connection;
    }
   
  // Make sure we don't call connect if it's already comnnected
    const connectionId$1 = `connection-${connectionId.nextValue}`;
    // await server.connect({ connectionId, connectionString: url });

    return server;

  }

  onConnectionStatusChanged(serverName, url, {status}){
    console.log(`connectionStatusChanged server ${serverName}, url ${url} status ${status}`);
  }

}

var ConnectionManager$1 = new ConnectionManager();

const { metaData } = columnUtils;
const logger$1 = createLogger('RemoteDataView', logColor.blue);

const AvailableProxies = {
  Viewserver: 'viewserver', 
  Vuu: 'vuu'
};

const NullServer = {
  handleMessageFromClient: message => console.log(`%cNullServer.handleMessageFromClient ${JSON.stringify(message)}`,'color:red')
};

const defaultRange = { lo: 0, hi: 0 };

/*-----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
class RemoteDataView  {

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
    logger$1.log(`range = ${JSON.stringify(range)}`);

    this.server = await ConnectionManager$1.connect(this.url, this.serverName);

    this.server.subscribe({
        viewport,
        tablename: tableName,
        columns,
        range
      }, message => {
          const { filterData/*, data, updates*/ } = message;
          if (filterData && this.filterDataCallback) {
            this.filterDataCallback(message);
          } else {
            callback(message);
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
      type: msgType.setViewRange,
      range: { lo, hi },
      dataType: DataTypes.ROW_DATA
    });
  }

  select(idx, _row, rangeSelect, keepExistingSelection){
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: msgType.select,
      idx,
      rangeSelect,
      keepExistingSelection
    });
  }

  group(columns) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: msgType.groupBy,
      groupBy: columns
    });
  }

  setGroupState(groupState) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: msgType.setGroupState,
      groupState
    });
  }

  sort(columns) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: msgType.sort,
      sortCriteria: columns
    });
  }

  filter(filter, dataType = DataTypes.ROW_DATA, incremental=false) {
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: msgType.filter,
      dataType,
      filter,
      incremental
    });
  }

  getFilterData(column, searchText) {
    console.log(`[RemoteDataView] getFilterData`);
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: msgType.getFilterData,
      column,
      searchText
    });
  }

  subscribeToFilterData(column, range, callback) {
    logger$1.log(`<subscribeToFilterData> ${column.name}`);
    this.filterDataCallback = callback;
    this.setFilterRange(range.lo, range.hi);
    if (this.filterDataMessage) {
      callback(this.filterDataMessage);
      // do we need to nullify now ?
    }

  }

  unsubscribeFromFilterData() {
    logger$1.log(`<unsubscribeFromFilterData>`);
    this.filterDataCallback = null;
  }

  // To support multiple open filters, we need a column here
  setFilterRange(lo, hi) {
    console.log(`setFilerRange ${lo}:${hi}`);
    this.server.handleMessageFromClient({
      viewport: this.viewport,
      type: msgType.setViewRange,
      dataType: DataTypes.FILTER_DATA,
      range: { lo, hi }
    });

  }

}

export { RemoteDataView, AvailableProxies as Servers, connectionId, msgType };
//# sourceMappingURL=index.js.map
