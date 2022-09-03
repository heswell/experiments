import { uuid } from './uuid.js';

import MessageQueue from './message-queue.js';
import { findHandler as handlerFor } from './requestHandlers.js';

var updateInterval = null;

var Frequency;

const CONTENT_TYPE_JSON = { 'Content-type': 'application/json' };

const _client_xhr_connections = {};

function getClientConnection(clientId) {
  var connection = _client_xhr_connections[clientId];
  if (connection === undefined) {
    connection = _client_xhr_connections[clientId] = {
      queue: new MessageQueue()
    };
  }

  return connection;
}

export function configure({
  PRIORITY_UPDATE_FREQUENCY: PRIORITY = 100,
  CLIENT_UPDATE_FREQUENCY: UPDATE = 250,
  HEARTBEAT_FREQUENCY: HEARTBEAT = 5000,
  TIMEOUT_PERIOD: TIMEOUT = 10000
}) {
  Frequency = {
    PRIORITY,
    UPDATE,
    HEARTBEAT,
    TIMEOUT
  };
}

export function handleRequest(request, response) {
  var content = '';
  request.on('data', (data) => (content += data));
  request.on('end', () => {
    let { clientId, message } = JSON.parse(content);
    //onsole.log(' 1) ' + JSON.stringify(message));
    var handler;

    if (message.type === 'connect') {
      let clientId = uuid();
      // save this, so we know whos's conencted
      response.writeHead(200, CONTENT_TYPE_JSON);
      response.end(JSON.stringify({ type: 'Welcome', clientId }));
    } else if (message.type === 'HB') {
      //onsole.log('>>> HeartBeat');
      let connection = getClientConnection(clientId);
      connection.response = response;
      connection.timestamp = new Date().getTime();

      if (updateInterval === null) {
        updateInterval = setTimeout(processXhrUpdates, Frequency.UPDATE);
      }
    } else if ((handler = handlerFor(message))) {
      let connection = getClientConnection(clientId);
      handler(clientId, message, connection.queue);
      console.log(
        `after calling the handler, queue contains ${JSON.stringify(
          connection.queue.length
        )} records`
      );

      // we need to be sure this message is for the same request
      if (connection.queue.length > 0) {
        response.writeHead(200, CONTENT_TYPE_JSON);
        var msg = JSON.stringify(connection.queue._queue);
        connection.queue.length = 0;
        response.end(msg);
      } else {
        // we need to distinguish from the HB response
        connection.response = response;
        // also set a timer to timeout the response ?
      }
    } else {
      console.log('server: dont know how to handle ' + JSON.stringify(message));
    }
  });
}

function processXhrUpdates() {
  const currentTime = new Date().getTime();
  var clients = Object.keys(_client_xhr_connections);
  var clientCount = clients.length;
  var deadClient = false;

  clients.forEach((clientId) => {
    let { queue, timestamp, response } = _client_xhr_connections[clientId];
    if (queue.length) {
      if (response) {
        //onsole.log(`processXhrHandler: client ${clientId} has ${queue.length} updates queued SEND UPDATES`);
        response.writeHead(200, CONTENT_TYPE_JSON);
        response.end(JSON.stringify(queue._queue));
        queue.length = 0;
        _client_xhr_connections[clientId].timestamp = currentTime;
        _client_xhr_connections[clientId].response = null;
      } else if (currentTime - timestamp > Frequency.TIMEOUT) {
        console.log(
          `We have updates and more than ${
            Frequency.TIMEOUT / 1000
          } seconds (TIMEOUT_PERIOD) since we communicated with this client`
        );
        deadClient = true;
      } else {
        console.log(
          `processXhrHandler: client ${clientId} has ${queue.length} updates queued, nor response available, wait for next client HB `
        );
      }
    } else if (currentTime - timestamp > Frequency.HEARTBEAT) {
      console.log(
        `more than ${
          Frequency.HEARTBEAT / 1000
        } seconds (HEARTBEAT_FREQUENCY) since we communicated with this client`
      );
      _client_xhr_connections[clientId].response = null;

      if (response) {
        response.writeHead(200, CONTENT_TYPE_JSON);
        response.end(JSON.stringify({ type: 'HB', timestamp: currentTime }));
        _client_xhr_connections[clientId].timestamp = currentTime;
      } else if (currentTime - timestamp > Frequency.TIMEOUT) {
        console.log(
          `more than ${
            Frequency.TIMEOUT / 1000
          } seconds (TIMEOUT_PERIOD) since we communicated with this client`
        );
        // assume the client is dead
        deadClient = true;
      }
    }

    if (deadClient === true) {
      requestHandlers.TerminateAllSubscriptionsForClient(clientId);
      updateInterval = null;
      delete _client_xhr_connections[clientId];
      clientCount -= 1;
    }
  });

  if (clientCount > 0) {
    updateInterval = setTimeout(processXhrUpdates, Frequency.UPDATE);
  }
}
