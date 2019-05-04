import uuid from '../../server-core/uuid';
import BaseDataView from './base-data-view';
import {
  msgType as Msg, createLogger, logColor,
  connectionId as _connectionId,
} from '../constants';

import { ServerProxy } from './remote-server-proxy';
import RemoteSubscription from './remote-subscription';
import { metaData } from '../../data/store/columnUtils';
import { DataTypes } from '../../data/store/types';

const logger = createLogger('RemoteDataView', logColor.blue);

/*----------------------------------------------------------------
  Set up the Server Proxy
  ----------------------------------------------------------------*/
const serverProxy = new ServerProxy(messageFromTheServer);

const postMessageToServer = async (message) => {
  serverProxy.handleMessageFromClient(message);
}

function messageFromTheServer({ data: { type: msgType, ...message } }) {
  switch (msgType) {
    case Msg.connectionStatus:
      logger.log(`<==   ${msgType}`)
      onConnected(message);
      break;
    case Msg.rowData:
    case Msg.filterData:
      subscriptions[message.viewport].postMessageToClient(message);
      break;
    case Msg.rowSet: {
      const { viewport, data } = message;
      // logger.log(JSON.stringify(message,null,2))
      subscriptions[message.viewport].postMessageToClient({
        viewport,
        rowData: data
      });
    }
      break;
    default:
      logger.log(`does not yet handle ${msgType}`);
  }
}

const defaultRange = { lo: 0, hi: 0 };

/*----------------------------------------------------------------
  connection/subscription management
  ----------------------------------------------------------------*/
const clientId = uuid();
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
export default class RemoteDataView extends BaseDataView {

  constructor(url, tableName) {
    super();

    connect(url);

    this.tableName = tableName;

    this.subscription = null;

    this.viewport = null;
    this.groupBy = undefined;
    this.groupState = undefined;
    this.sortBy = undefined;
    this.filterBy = undefined;
    this.filterRange = null;
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

    // logger.log(`subscribe ${tableName} columns: \n${columns.map((c,i)=>`${i}\t${c.name}`).concat(Object.keys(this.meta).map(m=>`${this.meta[m]}\t${m}`)).join('\n')} `)

    this.subscription = subscribe({
      ...options,
      viewport,
      tablename: tableName,
      columns,
      range
    }, (message) => {

      const { rowData, filterData } = message;

      if (rowData) {
        const { rows, size, offset, range } = rowData;

        const {lo:_lo,hi:_hi} = this.range || {lo:-1,hi:-1}
        logger.log(`message => range ${range.lo}:${range.hi} current range ${_lo}:${_hi}`)
  
        const mergedRows = this.processData(rows, size, offset)

        callback(mergedRows, size);

      } else if (filterData && this.filterDataCallback) {
        this.filterDataCallback(message)
      } else if (filterData) {
        // experiment - need to store the column as well
        this.filterDataMessage = message;
      }

    });

  }

  unsubscribe() {

  }

  setRange(lo, hi, dataType = DataTypes.ROW_DATA) {
    if (dataType === DataTypes.ROW_DATA){
      this.range = { lo, hi };
    }

    postMessageToServer({
      viewport: this.viewport,
      type: Msg.setViewRange,
      range: { lo, hi },
      dataType
    })
  }

  group(columns) {
    this.groupBy = columns;
    postMessageToServer({
      viewport: this.viewport,
      type: Msg.groupBy,
      groupBy: columns
    })
  }

  setGroupState(groupState) {
    this.groupState = groupState;
    postMessageToServer({
      viewport: this.viewport,
      type: Msg.setGroupState,
      groupState
    })
  }

  sort(columns) {
    this.sortBy = columns;
    postMessageToServer({
      viewport: this.viewport,
      type: Msg.sort,
      sortCriteria: columns
    })
  }

  filter(filter, dataType=DataTypes.ROW_DATA){
    this.filterBy = filter;
    postMessageToServer({
          viewport: this.viewport,
          type: Msg.filter,
          dataType,
          filter
      })
  }

  getFilterData(column, searchText) {
    if (this.subscription) {
      this.subscription.getFilterData(column, searchText);
    }
  }

  subscribeToFilterData(column, callback) {
    logger.log(`<subscribeToFilterData>`)
    this.filterDataCallback = callback;

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
    this.filterRange = { lo, hi };
    this.setRange(lo, hi, DataTypes.FILTER_DATA);
  }

}


/*--------------------------------------------------------

  Connecting to the server

  --------------------------------------------------------*/
export const connect = (
  connectionString,
  isDefaultConnection = true && defaultConnection.status === 'pending'
) => {
  if (isDefaultConnection) {
    // is it possible that defaultConnection.status could be pending, yet we have already 
    // resolved this connection ?

    // if we're already connected on the default connection ...
    // 
    // else ...

    defaultConnection.status = 'connecting';
  }
  logger.log(`connect ${connectionString} isDefaultConnection: ${isDefaultConnection}`)
  // connections[connectionString] set to a promise. However will be replaced with
  // the actual connection once connected, That can't be right
  return connections[connectionString] || (
    connections[connectionString] = new Promise(async (resolve, reject) => {
      const connectionId = `connection-${_connectionId.nextValue}`;
      const timeoutHandle = setTimeout(() => {
        delete pendingPromises[connectionId];
        reject(new Error('timed out waiting for server response'));
      }, 5000);
      pendingPromises[connectionId] = {
        resolve,
        reject,
        connectionString,
        timeoutHandle,
        // do we want this to be true ONLY if this was the first request ?
        isDefaultConnection
      };
      logger.log(JSON.stringify({ type: Msg.connect, clientId, connectionId, connectionString }))
      serverProxy.connect({ connectionId, connectionString });
    })
  )
}

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
export function subscribe(options, clientCallback) {
  logger.log(`<subscribe> vp ${options.viewport} table ${options.tablename}`)
  const viewport = options.viewport;
  const subscription = subscriptions[viewport] = new RemoteSubscription(viewport, postMessageToServer, clientCallback)

  // blocks here until connection is resolved (to an instance of ServerApi)
  getDefaultConnection().then(remoteConnection => {
    logger.log(`now we have a remoteConnection, we can subscribe`)
    remoteConnection.subscribe(options, viewport);
  });

  return subscription;
}

const RemoteConnectionAPI = (connectionId, postMessage) => ({

  disconnect() {
    console.log(`disconnect ${connectionId}`)
  },

  subscribe(message, viewport) {
    // From here, the serverProxy will maintain the association between connection
    // and viewport, we only have to supply viewport
    logger.log(`[RemoteConnection]<subscribe>  ===>  SW   vp: ${viewport}`)
    serverProxy.subscribe({
      connectionId,
      viewport,
      type: Msg.addSubscription,
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

