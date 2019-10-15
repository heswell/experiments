import { connectionId as _connectionId } from './constants';
import { createLogger, logColor, EventEmitter } from '@heswell/utils';
import Connection from './remote-websocket-connection';

const serverProxies = new WeakMap();
const servers = new WeakMap();

const logger = createLogger('ConnectionManager', logColor.blue);

const getServerProxy = async serverName => {
  console.log(`request for proxy class for ${serverName}`,serverProxies[serverName])

  return serverProxies[serverName] || (serverProxies[serverName] =
    import(/* webpackIgnore: true */`./server-proxy/${serverName}.js`));
}
const connectServer = async (serverName, url, onConnectionStatusMessage) => {
  logger.log(`request for server at ${url} ... `)
  
  return servers[url] || (servers[url] = new Promise(async (resolve, reject) => {
    const {ServerProxy} = await getServerProxy(serverName);
    if (ServerProxy){
      logger.log(`...resolved server at ${url}`)
      const server = new ServerProxy();
      const connection = await Connection.connect(
        url, 
        msg => server.handleMessageFromServer(msg),
        onConnectionStatusMessage
      );
      server.connection = connection;
      resolve(server);
    } else {
      reject('Unable to load class ServerProxy for server ${serverName}')
    }
  }))
}
  
class ConnectionManager extends EventEmitter {

  async connect(url, serverName){
    logger.log(`ConnectionManager.connect ${serverName} ${url}`);
    const server = await connectServer(
      serverName, 
      url, 
      msg => this.onConnectionStatusChanged(serverName, url, msg)
    );
   
  // Make sure we don't call connect if it's already comnnected
    const connectionId = `connection-${_connectionId.nextValue}`;
    // await server.connect({ connectionId, connectionString: url });

    return server;

  }

  onConnectionStatusChanged(serverName, url, {status}){
    console.log(`connectionStatusChanged server ${serverName}, url ${url} status ${status}`)
  }

}

export default new ConnectionManager();