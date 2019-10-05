import { DataTypes, columnUtils } from '@heswell/data';
import { uuid } from '@heswell/utils';

let _connectionId = 0;

const connectionId = {
  get nextValue(){
    return _connectionId++;
  }
};

const msgType = {
  connect : 'connect',
  connectionStatus : 'connection-status',
  rowData : 'rowData',
  rowSet: 'rowset',
  select : 'select',
  selected: 'selected',


  addSubscription: 'AddSubscription',
  collapseGroup : 'CollapseGroup',
  columnList : 'ColumnList',
  data : 'data',
  expandGroup : 'ExpandGroup',
  filter : 'filter',
  filterData : 'filterData',
  getFilterData : 'GetFilterData',
  getSearchData : 'GetSearchData',
  groupBy : 'groupBy',
  modifySubscription : 'ModifySubscription',
  searchData : 'searchData',
  setColumns: 'setColumns',
  setGroupState : 'setGroupState',
  setViewRange : 'setViewRange',
  size : 'size',
  snapshot : 'snapshot',
  sort : 'sort',
  subscribed : 'Subscribed',
  tableList : 'TableList',
  unsubscribe : 'TerminateSubscription',
  viewRangeChanged : 'ViewRangeChanged',
};

const logColor = {
  plain : 'color: black; font-weight: normal',
  blue : 'color: blue; font-weight: bold',
  brown : 'color: brown; font-weight: bold',
  green : 'color: green; font-weight: bold',
};

const {plain} = logColor;
const createLogger = (source, labelColor=plain, msgColor=plain) => ({
  log: (msg, args='') => console.log(`[${Date.now()}]%c[${source}] %c${msg}`,labelColor, msgColor, args),
  warn: (msg) => console.warn(`[${source}] ${msg}`)
});

// This is given to client on subscription and acts as a conduit between client and server
// client calls api methods directly, the view calls postMessageToClient when it receives
// responses from server. 
class RemoteSubscription {
  constructor(viewport, postMessageToServer, postMessageToClient){
      this.viewport = viewport;
      this.postMessageToServer = postMessageToServer;
      this.postMessageToClient = postMessageToClient;
  }


  getFilterData(column, searchText, range){
    this.postMessageToServer({
          viewport: this.viewport,
          type: msgType.getFilterData,
          column,
          searchText,
          range
      });
  }
}

const { metaData } = columnUtils;
const logger = createLogger('RemoteDataView', logColor.blue);

const AvailableProxies = {
  Viewserver: 'viewserver', 
  Vuu: 'vuu'
};

/*----------------------------------------------------------------
  Set up the Server Proxy
  ----------------------------------------------------------------*/
  // TODO isn't it more natural to pass messageFromTheServer to subscribe ?
// const serverProxy = new ServerProxy(messageFromTheServer);
let serverProxy;

const postMessageToServer = async (message) => {
  serverProxy.handleMessageFromClient(message);
};

function messageFromTheServer({ type: msgType$1, ...message }) {
  switch (msgType$1) {
    case msgType.connectionStatus:
      logger.log(`<==   ${msgType$1}`);
      onConnected(message);
      break;
    case msgType.snapshot:
    case msgType.rowSet: 
    case msgType.selected:
    case msgType.filterData:
      subscriptions[message.viewport].postMessageToClient(message);
      break;
    default:
      logger.warn(`does not yet handle ${msgType$1}`);
  }
}

const defaultRange = { lo: 0, hi: 0 };

/*----------------------------------------------------------------
  connection/subscription management
  ----------------------------------------------------------------*/
const clientId = uuid(); // what purpose does this serve ?
const connections = {};
const subscriptions = {};
const pendingPromises = {};
let defaultConnection = { status: 'pending' };
let pendingConnection = new Promise((resolve, reject) => {
  defaultConnection.resolve = resolve;
  defaultConnection.reject = reject;
});

const getDefaultConnection = () => pendingConnection;


/*-----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
class RemoteDataView  {

  constructor({url, tableName, server = AvailableProxies.Viewserver}) {
    connect(url, server);
    this.columns = null;
    this.meta = null;

    this.tableName = tableName;
    this.subscription = null;
    this.viewport = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;
  }

  subscribe({
    viewport = uuid(),
    tableName = this.tableName,
    columns,
    range = defaultRange,
    ...options
  }, callback) {

    if (!tableName) throw Error("RemoteDataView subscribe called without table name");
    if (!columns) throw Error("RemoteDataView subscribe called without columns");

    this.viewport = viewport;
    this.tableName = tableName;
    this.columns = columns;
    this.meta = metaData(columns);
    logger.log(`range = ${JSON.stringify(range)}`);

    this.subscription = subscribe({
      ...options,
      viewport,
      tablename: tableName,
      columns,
      range
    }, /* postMessageToClient */(message) => {

      const { filterData, data } = message;
      if (data && data.rows) {
        callback(data);
      } else if (filterData && this.filterDataCallback) {
        this.filterDataCallback(message);
      } else if (filterData) {
        // experiment - need to store the column as well
        this.filterDataMessage = message;
      } else if (data && data.selected){
        // TODO think about this
        const {selected, deselected} = data;
        callback({range, selected, deselected});
      }

    });

  }

  unsubscribe() {

  }

  setRange(lo, hi) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.setViewRange,
      range: { lo, hi },
      dataType: DataTypes.ROW_DATA
    });
  }

  select(idx, _row, rangeSelect, keepExistingSelection){
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.select,
      idx,
      rangeSelect,
      keepExistingSelection
    });
  }

  group(columns) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.groupBy,
      groupBy: columns
    });
  }

  setGroupState(groupState) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.setGroupState,
      groupState
    });
  }

  sort(columns) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.sort,
      sortCriteria: columns
    });
  }

  filter(filter, dataType = DataTypes.ROW_DATA, incremental=false) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.filter,
      dataType,
      filter,
      incremental
    });
  }

  getFilterData(column, searchText) {
    if (this.subscription) {
      this.subscription.getFilterData(column, searchText);
    }
  }

  subscribeToFilterData(column, range, callback) {
    logger.log(`<subscribeToFilterData>`);
    this.filterDataCallback = callback;
    this.setFilterRange(range.lo, range.hi);
    if (this.filterDataMessage) {
      callback(this.filterDataMessage);
      // do we need to nullify now ?
    }

  }

  unsubscribeFromFilterData() {
    logger.log(`<unsubscribeFromFilterData>`);
    this.filterDataCallback = null;
  }

  // To support multiple open filters, we need a column here
  setFilterRange(lo, hi) {
    console.log(`setFilerRange ${lo}:${hi}`);
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.setViewRange,
      dataType: DataTypes.FILTER_DATA,
      range: { lo, hi }
    });

  }

}


/*--------------------------------------------------------

  Connecting to the server

  --------------------------------------------------------*/
//TODO support for additional connections
const connect = (
  connectionString,
  server = AvailableProxies.Viewserver,
  isDefaultConnection =  defaultConnection.status === 'pending'
) => {
  if (isDefaultConnection) {
    // is it possible that defaultConnection.status could be pending, yet we have already 
    // resolved this connection ?

    // if we're already connected on the default connection ...
    // 
    // else ...

    defaultConnection.status = 'connecting';
  }
  logger.log(`connect ${connectionString} isDefaultConnection: ${isDefaultConnection}`);
  // connections[connectionString] set to a promise. However will be replaced with
  // the actual connection once connected, That can't be right
  return connections[connectionString] || (
    connections[connectionString] = new Promise(async (resolve, reject) => {
      const connectionId$1 = `connection-${connectionId.nextValue}`;
      const timeoutHandle = setTimeout(() => {
        delete pendingPromises[connectionId$1];
        reject(new Error('timed out waiting for server response'));
      }, 5000);
      pendingPromises[connectionId$1] = {
        resolve,
        reject,
        connectionString,
        timeoutHandle,
        // do we want this to be true ONLY if this was the first request ?
        isDefaultConnection
      };
      logger.log(JSON.stringify({ type: msgType.connect, clientId, connectionId: connectionId$1, connectionString }));

      import(/* webpackIgnore: true */ `./server-proxy/${server}.js`)
      .then(module => {
        const {ServerProxy} = module;
        serverProxy = new ServerProxy(messageFromTheServer);
        serverProxy.connect({ connectionId: connectionId$1, connectionString });
      })
      .catch(err => console.log(`failed to load Server Proxy ${err}`));
    })
  )
};

function onConnected(message) {
  if (message.status === 'ready') {
    const { connectionId } = message;
    if (pendingPromises[connectionId]) {
      // TODO handle reject here as well
      const { resolve, connectionString, timeoutHandle, isDefaultConnection } = pendingPromises[connectionId];
      clearTimeout(timeoutHandle);
      delete pendingPromises[connectionId];
      const connection = connections[connectionString] = RemoteConnectionAPI(connectionId, postMessageToServer);
      resolve(connection);
      if (isDefaultConnection && defaultConnection.status !== 'connected') {
        defaultConnection.status = 'connected';
        defaultConnection.resolve(connection);
      }
    }
  }
}

/*--------------------------------------------------------

  Subscribing to services

  --------------------------------------------------------*/
function subscribe(options, clientCallback) {
  logger.log(`<subscribe> vp ${options.viewport} table ${options.tablename}`);
  const viewport = options.viewport;
  // This remoteview is specific to this viewport, no need for mapping
  const subscription = subscriptions[viewport] = new RemoteSubscription(viewport, postMessageToServer, clientCallback);

  // subscription blocks here until connection is resolved (to an instance of RemoteConnectionAPI)
  getDefaultConnection().then(remoteConnection => {
    logger.log(`>>>>> now we have a remoteConnection, we can subscribe`);
    remoteConnection.subscribe(options, viewport);
  });

  return subscription;
}

const RemoteConnectionAPI = (connectionId, postMessage) => ({

  disconnect() {
    console.log(`disconnect ${connectionId}`);
  },

  subscribe(message, viewport) {
    // From here, the serverProxy will maintain the association between connection
    // and viewport, we only have to supply viewport
    logger.log(`[RemoteConnection]<subscribe>  ===>  SW   vp: ${viewport}`);
    serverProxy.subscribe({
      connectionId,
      viewport,
      type: msgType.addSubscription,
      ...message
    });
  },

  query: (type, params = null) => new Promise((resolve, reject) => {
    const requestId = uuid.v1();
    postMessage({ requestId, type, params });
    const timeoutHandle = setTimeout(() => {
      delete pendingPromises[requestId];
      reject(Error('query timed out waiting for server response'));
    }, 5000);
    pendingPromises[requestId] = { resolve, reject, timeoutHandle };
  })

});

export { RemoteDataView, connectionId, createLogger, logColor, msgType };
//# sourceMappingURL=index.js.map
