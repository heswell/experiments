import uuid from '../server-core/uuid';
import {msgType as Msg, createLogger, logColor,
  connectionId as _connectionId,
} from './constants';

import {ServerProxy} from './remote-server-proxy.js';
import RemoteSubscription from './remote-subscription';

const serverProxy = new ServerProxy(messageFromTheServer);

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
      default:
          logger.log(`does not yet handle ${msgType}}`);
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

const logger = createLogger('RemoteDataView', logColor.blue);


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
          const connection = connections[connectionString] = RemoteConnection(connectionId, postMessageToServer);
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
export function subscribe(message, clientCallback){
  logger.log(`<subscribe> vp ${message.viewport}`)
  const viewport = message.viewport;
  const subscription = subscriptions[viewport] = new RemoteSubscription(viewport, postMessageToServer, clientCallback)

  // blocks here until connection is resolved (to an instance of ServerApi)
   getDefaultConnection().then(remoteConnection => {
      logger.log(`now we have a remoteConnection, we can subscribe`)
      remoteConnection.subscribe(message, viewport);
  });
  // clearTimeout(timeoutHandle);

  return subscription;
}

const RemoteConnection = (connectionId, postMessage) => ({
  
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