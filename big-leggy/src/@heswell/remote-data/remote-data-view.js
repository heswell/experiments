import uuid from '../server-core/uuid';
import {msgType as Msg, createLogger, logColor,
  connectionId as _connectionId,
} from './constants';

import {ServerProxy} from './remote-server-proxy.js';

const serverProxy = new ServerProxy(messageFromTheServer);

export const postMessageToWorker = async (message) => {
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
          postMessageToWorker({type: Msg.connect, clientId, connectionId, connectionString});
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
          const connection = connections[connectionString] = RemoteConnection(connectionId, postMessageToWorker);
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
export function subscribe(message){
  console.log(`[serverApi2.subscribe] vp ${message.viewport}`)
  const viewport = message.viewport;
  // const subscription = subscriptions[viewport] = new ClientSubscription(null, viewport)
  const subscription = subscriptions[viewport] = new Proxy({}, {
    get: function(o, p) {
      return (...args) => {
        logger.log(`method ${p} invoked on ClientSubscription proxy`, args)
      }
    }
  });

  // blocks here until connection is resolved (to an instance of ServerApi)
   getDefaultConnection().then(remoteConnection => {
      console.log(`serverApi, now we have a remoteConnection, we can subscribe`)
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
        logger.log(`${Msg.addSubscription}  ===>  SW   vp: ${viewport} ${JSON.stringify(message,null,2)}`)
        postMessage({
            connectionId,
            viewport,
            type: Msg.addSubscription,
            ...message
        })
        if (subscriptions[viewport]){
            subscriptions[viewport].connectionId = this.connectionId;
            return subscriptions[viewport];
        } else {
            // when would there NOT be an existing subscription
            return subscriptions[viewport] = new Proxy({}, {
              get: function(o, p) {
                return p === 'then'
                  ? undefined
                  : (...args) => {
                    logger.log(`method ${p} invoked on RemoteConnection subscription proxy`, args)
                }
              }
            });
            // return subscriptions[viewport] = new ClientSubscription(this.connectionId, viewport);
        }
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