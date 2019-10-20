import { DataTypes, columnUtils } from '@heswell/data';
import { createLogger, logColor, EventEmitter, invariant, uuid } from '@heswell/utils';

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

const logger = createLogger('WebsocketConnection', logColor.brown);

const connectionAttempts = {};

const setWebsocket = Symbol('setWebsocket');
const connectionCallback = Symbol('connectionCallback');
const destroyConnection = Symbol('destroyConnection');

async function connect(connectionString, callback, connectionStatusCallback) {
    return makeConnection(connectionString, msg => {
      const {type} = msg;
      if (type === 'connection-status'){
        connectionStatusCallback(msg);
      } else if (type === 'HB'){
          console.log(`swallowing HB in WebsocketConnection`);
      } else if (type === 'Welcome'){
        // Note: we are actually resolving the connection before we get this session message
        logger.log(`Session established clientId: ${msg.clientId}`);
      } else {
        callback(msg);
      }
    });
}

async function reconnect(connection){
  console.log(`reconnect connection at ${connection.url}`);
  makeConnection(connection.url, connection[connectionCallback], connection);
}

async function makeConnection(url, callback, connection){

  const connectionStatus = connectionAttempts[url] || (connectionAttempts[url] = {
    attemptsRemaining: 5,
    status: 'not-connected'
  });

  try {
    callback({type: 'connection-status', status: 'connecting'});
    const reconnecting = typeof connection !== 'undefined';
    const ws = await createWebsocket(url);

    console.log(`%c⚡ %c${url}`, 'font-size: 24px;color: green;font-weight: bold;','color:green; font-size: 14px;');
    
    if (reconnecting){
      connection[setWebsocket](ws);
    } else {
      connection = new Connection(ws, url, callback);
    }

    callback({type: 'connection-status', status: reconnecting ? 'reconnected' : 'connected'});

    return connection;
  
  } catch(evt){
    const retry = --connectionStatus.attemptsRemaining > 0;
    callback({type: 'connection-status', status: 'not-connected', reason: 'failed to connect', retry});
    if (retry){
      return makeConnectionIn(url, callback, connection, 10000);
    }
  }
}

const makeConnectionIn = (url, callback, connection, delay) => new Promise(resolve => {
  setTimeout(() => {
    resolve(makeConnection(url, callback, connection));
  }, delay);
}); 

const createWebsocket = connectionString => new Promise((resolve, reject) => {
  //TODO add timeout
    const ws = new WebSocket('ws://' + connectionString);
    ws.onopen = () => resolve(ws);
    ws.onerror = evt => reject(evt);  
});


class Connection {

  constructor(ws, url, callback) {

    this.url = url;
    this[connectionCallback] = callback;

    this[setWebsocket](ws);

  }

  [setWebsocket](ws){

    const callback = this[connectionCallback];

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
      console.log(`%c⚡ %c${this.url}`, 'font-size: 24px;color: red;font-weight: bold;','color:red; font-size: 14px;');
      callback({type: 'connection-status', status: 'disconnected', reason: 'error'});
      reconnect(this);
      this.send = queue;
    };

    ws.onclose = evt => {
      console.log(`%c⚡ %c${this.url}`, 'font-size: 24px;color: orange;font-weight: bold;','color:orange; font-size: 14px;');
      callback({type: 'connection-status', status: 'disconnected', reason: 'close'});
      reconnect(this);
      this.send = queue;
    };

    const send = msg => {
      ws.send(JSON.stringify(msg));
    };

    const queue = msg => {
      console.log(`queuing message ${JSON.stringify(msg)}`);
    };

    this.send = send;

  }

  [destroyConnection](){
    console.log(`destroy !!!!!`);
  }
}

const serverProxies = new WeakMap();
const servers = new WeakMap();

const logger$1 = createLogger('ConnectionManager', logColor.green);

const getServerProxy = async serverName => {
  console.log(`request for proxy class for ${serverName}`,serverProxies[serverName]);

  return serverProxies[serverName] || (serverProxies[serverName] =
    import(/* webpackIgnore: true */`./server-proxy/${serverName}.js`));
};
const connectServer = async (serverName, url, onConnectionStatusMessage) => {
  
  return servers[url] || (servers[url] = new Promise(async (resolve, reject) => {
    const proxyModule = getServerProxy(serverName);
    const pendingConnection = connect(
      url,
      // if this was called during connect, we would get a ReferenceError, but it will
      // never be called until subscriptions have been made, so this is safe.
      msg => server.handleMessageFromServer(msg),
      msg => {
        onConnectionStatusMessage(msg);
        if (msg.status === 'disconnected'){
          server.disconnected();
        } else if (msg.status === 'reconnected'){
          server.resubscribeAll();
        } 
      }
    );
    
    const [{ServerProxy}, connection] = [await proxyModule, await pendingConnection];
    invariant(typeof ServerProxy === 'function', 'Unable to load ServerProxy class for ${serverName}');
    invariant(connection !== undefined, 'unable to open connection to ${url}');
    // if the connection breaks, the serverPrtoxy will continue top 'send' messages 
    const server = new ServerProxy(connection);
    
    // How do we handle authentication, login
    if (typeof server.authenticate === 'function'){
      await server.authenticate('steve', 'pword');
    }
    if (typeof server.login === 'function'){
      await server.login();
    }

    resolve(server);
  }))
};
  
class ConnectionManager extends EventEmitter {

  async connect(url, serverName){
    logger$1.log(`ConnectionManager.connect ${serverName} ${url}`);
    return connectServer(
      serverName, 
      url, 
      msg => this.onConnectionStatusChanged(serverName, url, msg)
    );
  }

  onConnectionStatusChanged(serverName, url, msg){
    const {status} = msg;
    logger$1.log(`connectionStatusChanged server ${serverName}, url ${url} status ${status}`);
    this.emit('connection-status', msg);
  }

}

var ConnectionManager$1 = new ConnectionManager();

const { metaData } = columnUtils;
const logger$2 = createLogger('RemoteDataView', logColor.blue);

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
    logger$2.log(`range = ${JSON.stringify(range)}`);

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
    logger$2.log(`<subscribeToFilterData> ${column.name}`);
    this.filterDataCallback = callback;
    this.setFilterRange(range.lo, range.hi);
    if (this.filterDataMessage) {
      callback(this.filterDataMessage);
      // do we need to nullify now ?
    }

  }

  unsubscribeFromFilterData() {
    logger$2.log(`<unsubscribeFromFilterData>`);
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
