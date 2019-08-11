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

class Connection {

  static connect(connectionString, callback) {
    return new Promise(function (resolve) {
        const connection = new Connection(connectionString, msg => {
          const {type} = msg;
          if (type === 'connection-status'){
            resolve(connection);
          } else if (type === 'HB'); else {
            callback(msg);
          }
        });
    });
  }

  constructor(connectionString, callback) {
      this._callback = callback;
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

      ws.onerror = evt => websocketError(callback);
      ws.onclose = evt => websocketClosed(callback);
      this.ws = ws;
  }

  send(message) {
      // console.log(`%c>>>  (WebSocket) ${JSON.stringify(message)} bufferedAmount ${this.ws.bufferedAmount}`,'color:yellow;background-color:blue;font-weight:bold;');
      this.ws.send(JSON.stringify(message));
  }

}

function websocketError(callback) {
  callback({type:'websocket.websocketError'});
}

function websocketClosed(callback) {
  callback({type:'websocket.websocketClosed'});
}

const ServerApiMessageTypes = {
  addSubscription: 'AddSubscription',
  setColumns: 'setColumns'
};
const FILTER_DATA = 'filterData';
const SUBSCRIBED = 'Subscribed';
const SET_VIEWPORT_RANGE = 'setViewRange';
const SEARCH_DATA = 'searchData';

const logger = createLogger('RemoteServerProxy', logColor.blue);

function partition(array, test, pass = [], fail = []) {

    for (let i = 0, len = array.length; i < len; i++) {
        (test(array[i], i) ? pass : fail).push(array[i]);
    }

    return [pass, fail];
}

// we use one ServerProxy per client (i.e per browser instance)
// This is created as a singleton in the (remote-data) view
class ServerProxy {

    constructor(clientCallback) {
        this.connection = null;
        this.connectionStatus = 'not-connected';

        this.queuedRequests = [];
        this.viewportStatus = {};
        this.pendingSubscriptionRequests = {};
        this.postMessageToClient = clientCallback;

    }

    handleMessageFromClient(message) {
        this.sendIfReady(message, this.viewportStatus[message.viewport] === 'subscribed');
    }

    sendIfReady(message, isReady) {
        // TODO implement the message queuing in remote data view
        if (isReady) {
            this.sendMessageToServer(message);
        } else {
            this.queuedRequests.push(message);
        }

        return isReady;

    }

    // if we're going to support multiple connections, we need to save them against connectionIs
    async connect({ connectionString, connectionId = 0 }) {

        logger.log(`<connect> connectionString: ${connectionString} connectionId: ${connectionId}`);
        this.connectionStatus = 'connecting';
        this.connection = await Connection.connect(connectionString, msg => this.handleMessageFromServer(msg));
        this.onReady(connectionId);
    }

    subscribe(message) {
        const isReady = this.connectionStatus === 'ready';
        const { viewport } = message;
        this.pendingSubscriptionRequests[viewport] = message;
        this.viewportStatus[viewport] = 'subscribing';
        this.sendIfReady( message, isReady);
    }

    subscribed(/* server message */ message) {
        const { viewport } = message;
        if (this.pendingSubscriptionRequests[viewport]) {

            const request = this.pendingSubscriptionRequests[viewport];
            // const {table, columns, sort, filter, groupBy} = request;
            let { range } = request;
            logger.log(`<handleMessageFromServer> SUBSCRIBED create subscription range ${range.lo} - ${range.hi}`);

            this.pendingSubscriptionRequests[viewport] = undefined;
            this.viewportStatus[viewport] = 'subscribed';

            const byViewport = vp => item => item.viewport === vp;
            const byMessageType = msg => msg.type === SET_VIEWPORT_RANGE;
            const [messagesForThisViewport, messagesForOtherViewports] = partition(this.queuedRequests, byViewport(viewport));
            const [rangeMessages, otherMessages] = partition(messagesForThisViewport, byMessageType);

            this.queuedRequests = messagesForOtherViewports;
            rangeMessages.forEach(msg => {

                range = msg.range;

            });

            if (otherMessages.length) {
                console.log(`we have ${otherMessages.length} messages still to process`);
            }

        }

    }

    onReady(connectionId) {
        this.connectionStatus = 'ready';
        // messages which have no dependency on previous subscription
        logger.log(`%c onReady ${JSON.stringify(this.queuedRequests)}`, 'background-color: brown;color: cyan');

        const byReadyToSendStatus = msg => msg.viewport === undefined || msg.type === ServerApiMessageTypes.addSubscription;
        const [readyToSend, remainingMessages] = partition(this.queuedRequests, byReadyToSendStatus);
        // TODO roll setViewRange messages into subscribe messages
        readyToSend.forEach(msg => this.sendMessageToServer(msg));
        this.queuedRequests = remainingMessages;
        this.postMessageToClient({ type: 'connection-status', status: 'ready', connectionId });
    }

    sendMessageToServer(message) {
        const { clientId } = this.connection;
        this.connection.send({ clientId, message });
    }

    handleMessageFromServer(message) {
        const { type, viewport } = message;

        switch (type) {

            case SUBSCRIBED:
                this.subscribed(message);
                break;

            case FILTER_DATA:
            case SEARCH_DATA:
                const { data: filterData } = message;
                // const { rowset: data } = subscription.putData(type, filterData);

                // if (data.length || filterData.size === 0) {
                this.postMessageToClient({
                    type,
                    viewport,
                    [type]: filterData
                });
                // }

                break;

            default:
                this.postMessageToClient(message);

        }

    }

}

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
const logger$1 = createLogger('RemoteDataView', logColor.blue);

/*----------------------------------------------------------------
  Set up the Server Proxy
  ----------------------------------------------------------------*/
  // TODO isn't it more natural to pass messageFromTheServer to subscribe ?
const serverProxy = new ServerProxy(messageFromTheServer);

const postMessageToServer = async (message) => {
  serverProxy.handleMessageFromClient(message);
};

function messageFromTheServer({ type: msgType$1, ...message }) {
  switch (msgType$1) {
    case msgType.connectionStatus:
      logger$1.log(`<==   ${msgType$1}`);
      onConnected(message);
      break;
    case msgType.snapshot:
    case msgType.rowSet: 
    case msgType.selected:
    case msgType.filterData:
      subscriptions[message.viewport].postMessageToClient(message);
      break;
    default:
      logger$1.warn(`does not yet handle ${msgType$1}`);
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


/*----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
class RemoteDataView  {

  constructor({url, tableName}) {
    connect(url);
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
    logger$1.log(`range = ${JSON.stringify(range)}`);

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
    logger$1.log(`<subscribeToFilterData>`);
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
const connect = (
  connectionString,
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
  logger$1.log(`connect ${connectionString} isDefaultConnection: ${isDefaultConnection}`);
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
      logger$1.log(JSON.stringify({ type: msgType.connect, clientId, connectionId: connectionId$1, connectionString }));
      serverProxy.connect({ connectionId: connectionId$1, connectionString });
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
  logger$1.log(`<subscribe> vp ${options.viewport} table ${options.tablename}`);
  const viewport = options.viewport;
  // This remoteview is specific to this viewport, no need for mapping
  const subscription = subscriptions[viewport] = new RemoteSubscription(viewport, postMessageToServer, clientCallback);

  // subscription blocks here until connection is resolved (to an instance of ServerApi)
  getDefaultConnection().then(remoteConnection => {
    logger$1.log(`>>>>> now we have a remoteConnection, we can subscribe`);
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
    logger$1.log(`[RemoteConnection]<subscribe>  ===>  SW   vp: ${viewport}`);
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
