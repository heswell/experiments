import { connectionId as _connectionId } from './constants';
import { createLogger, logColor } from '@heswell/utils';

const serverProxies = new WeakMap();
const servers = new WeakMap();

const logger = createLogger('ConnectionManager', logColor.blue);

const getServerProxy = async serverName => {
  return serverProxies[serverName] || (serverProxies[serverName] =
    import(/* webpackIgnore: true */`./server-proxy/${serverName}.js`));
}
const getServer = async (serverName, url, messageFromTheServer) => {
  if (servers[url]){
    return servers[url];
  } 
  const {ServerProxy} = await getServerProxy(serverName);
  return servers[url] = Promise.resolve(new ServerProxy(messageFromTheServer));
}
  
// We want this to be an eventemitter so we can broadcast connection events 
export default {
  async connect(url, serverName){
    logger.log(`ConnectionManager.connect ${serverName} ${url}`);

    const server = await getServer(serverName, url);
  // Make sure we don't call connect if it's already comnnected
    const connectionId = `connection-${_connectionId.nextValue}`;
    await server.connect({ connectionId, connectionString: url });

    return server;

  }
}