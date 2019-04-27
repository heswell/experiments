import uuid from '../server-core/uuid';
import {msgType as Msg, createLogger, logColor,
  connectionId as _connectionId,
} from './constants';

import {ServerProxy} from './remote-server-proxy.js';
import RemoteSubscription from './remote-subscription';
import { metaData } from '../data/store/columnUtils';

const logger = createLogger('RemoteDataView', logColor.blue);

const serverProxy = new ServerProxy(messageFromTheServer);

const defaultRange = {lo: 0, hi: 0};

export default class RemoteDataView {

  constructor(url, tableName){
    connect(url);
    
    this.tableName = tableName;

    this.subscription = null;

    this.columns = null;
    this.meta = null;
    this.range = null;
    this.groupBy = undefined;
    this.groupState = undefined;
    this.sortBy = undefined;
    this.filterBy = undefined;

    this.size = 0;
    this.dataRows = [];
    this.filterRows = [];
  }

  subscribe({
    viewport = uuid(),
    tableName=this.tableName,
    columns,
    range= defaultRange,
    ...options
    }, callback){
      
      if (!tableName) throw Error("RemoteDataView subscribe called without table name");
      if (!columns) throw Error("RemoteDataView subscribe called without columns");

      this.tableName = tableName;
      this.columns = columns;
      this.meta = metaData(columns);

      logger.log(`subscribe ${tableName} columns: \n${columns.map((c,i)=>`${i}\t${c.name}`).concat(Object.keys(this.meta).map(m=>`${this.meta[m]}\t${m}`)).join('\n')} `)

      this.subscription = subscribe({
        ...options,
        viewport,
        tablename: tableName,
        columns,
        range
      }, (message) => {

        const {rowData: {rows, size, range, offset}} = message;

        logger.log(`receive rows ${rows.length} of ${size} for range ${range.lo}:${range.hi} (current range ${this.range.lo}:${this.range.hi})`, message)

        const mergedRows = mergeAndPurge(this.range, this.rows, offset, rows, size, this.meta);

        console.table(mergedRows);

      
        this.size = size;
        this.rows = mergedRows;
      
        callback(mergedRows);
    
    });

    logger.log(`git a subscription`, this.subscription)
  }

  unsubscribe(){

  }

  set rows(newRows){
    this.dataRows = newRows;
  }

  get rows(){
    return this.dataRows;
  }

  setRange(lo, hi){
    logger.log(`setRange lo: ${lo} hi ${hi}`)
    this.range = {lo,hi};
    if (this.subscription){
      this.subscription.setRange(lo,hi);
    }
  }

  group(columns){
    this.groupBy = columns;
    if (this.subscription){
      this.subscription.groupBy(columns);
    }
  }

  setGroupState(groupState){
    this.groupState = groupState;
    if (this.subscription){
      this.subscription.setGroupState(groupState);
    }
  }

  sort(columns){
    this.sortBy = columns;
    if (this.subscription){
      this.subscription.sort(columns);
    }

  }

  filter(filter){
    this.filterBy = filter;
    if (this.subscription){
      this.subscription.filter(filter);
    }

  }

  getFilterData(column, searchText){
    if (this.subscription){
      this.subscription.getFilterData(column, searchText);
    }
  }
}

export const postMessageToServer = async (message) => {
    // const worker = await getWorker();
    // worker.postMessage(message);
  serverProxy.handleMessageFromClient(message);
}

function messageFromTheServer({data: {type: msgType, ...message}}){
  switch (msgType){
      case Msg.connectionStatus:
          logger.log(`<==   ${msgType}`)
          onConnected(message);
          break;
      case Msg.rowData:
          subscriptions[message.viewport].postMessageToClient(message);
          break;
      case Msg.rowSet: {  
          const {viewport, data} = message;
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


let _requestId = 1;
const clientId = uuid();

const connections = {};
const subscriptions = {};
const pendingPromises = {};
let defaultConnection = {status: 'pending'};
let pendingConnection = new Promise((resolve, reject) => {
    defaultConnection.resolve = resolve;
    defaultConnection.reject = reject;
});

const getDefaultConnection = () => pendingConnection;


/*--------------------------------------------------------

  Connecting to the server

  --------------------------------------------------------*/
export const connect = (
  connectionString,
  isDefaultConnection=true && defaultConnection.status === 'pending'
) => {
  if (isDefaultConnection){
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
          logger.log(JSON.stringify({type: Msg.connect, clientId, connectionId, connectionString}))
          serverProxy.connect({connectionId, connectionString});
      })
  )
}

function onConnected(message){
  if (message.status === 'ready'){
      const {connectionId} = message;
      if (pendingPromises[connectionId]){
          // TODO handle reject here as well
          const {resolve, connectionString, timeoutHandle, isDefaultConnection} = pendingPromises[connectionId];
          clearTimeout(timeoutHandle);
          delete pendingPromises[connectionId];
          const connection = connections[connectionString] = RemoteConnectionAPI(connectionId, postMessageToServer);
          resolve(connection);
          if (isDefaultConnection && defaultConnection.status !== 'connected'){
              defaultConnection.status = 'connected';
              defaultConnection.resolve(connection);
          }
      }
  }
}

/*--------------------------------------------------------

  Subscribing to services

  --------------------------------------------------------*/
export function subscribe(options, clientCallback){
  logger.log(`<subscribe> vp ${options.viewport} table ${options.tablename}`)
  const viewport = options.viewport;
  const subscription = subscriptions[viewport] = new RemoteSubscription(viewport, postMessageToServer, clientCallback)

  // blocks here until connection is resolved (to an instance of ServerApi)
   getDefaultConnection().then(remoteConnection => {
      logger.log(`now we have a remoteConnection, we can subscribe`)
      remoteConnection.subscribe(options, viewport);
  });
  // clearTimeout(timeoutHandle);

  return subscription;
}

const RemoteConnectionAPI = (connectionId, postMessage) => ({
  
    disconnect(){
        console.log(`disconnect ${connectionId}`)
    },

    subscribe(message, viewport){
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

    query: (type, params=null) => new Promise((resolve, reject) => {
            const requestId = uuid.v1();
            postMessage({ requestId, type, params });
            const timeoutHandle = setTimeout(() => {
                delete pendingPromises[requestId];
                reject(Error('query timed out waiting for server response'));
            }, 5000);
            pendingPromises[requestId] = {resolve, reject, timeoutHandle};
        })

});

/*--------------------------------------------------------

Utility functions

  --------------------------------------------------------*/

// TODO create a pool of these and reuse them
function emptyRow(idx, {IDX, count}){
  const row = Array(count);
  row[IDX] = idx;
  return row;
}

function mergeAndPurge({lo, hi}, rows, offset = 0, newRows, size, meta) {
  // console.groupCollapsed(`mergeAndPurge range: ${lo} - ${hi} 
  //  old   rows: [${rows.length ? rows[0][0]: null} - ${rows.length ? rows[rows.length-1][0]: null}]
  //  new   rows: [${newRows.length ? newRows[0][0]: null} - ${newRows.length ? newRows[newRows.length-1][0]: null}]
  //     `);
  const {IDX} = meta;
  const results = [];
  const low = lo + offset;
  const high = Math.min(hi + offset, size + offset);

  let idx;
  let row;

  for (let i = 0; i < newRows.length; i++) {
    if (row = newRows[i]) {
        idx = row[IDX];

        if (idx >= low && idx < high) {
            results[idx - low] = newRows[i];
        }
    }
  }

  for (let i = 0; i < rows.length; i++) {
      if (row = rows[i]) {
          idx = row[IDX];
          if (idx >= low && idx < high && results[idx - low] === undefined){
            results[idx - low] = rows[i];
          }
      }
  }


  // make sure the resultset contains entries for the full range
  // TODO make this more efficient
  const rowCount = hi - lo;
  for (let i=0;i<rowCount;i++){
      if (results[i] === undefined){
          results[i] = emptyRow(i+low, meta);
      }
  }
  // console.table(results);
  // console.groupEnd();
  return results;

}
