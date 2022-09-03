import { uuid } from "./uuid.js";
import MessageQueue from "./message-queue.js";
import { findHandler as handlerFor } from "./requestHandlers.js";
var updateInterval = null;
var Frequency;
const CONTENT_TYPE_JSON = { "Content-type": "application/json" };
const _client_xhr_connections = {};
function getClientConnection(clientId) {
  var connection = _client_xhr_connections[clientId];
  if (connection === void 0) {
    connection = _client_xhr_connections[clientId] = {
      queue: new MessageQueue()
    };
  }
  return connection;
}
function configure({
  PRIORITY_UPDATE_FREQUENCY: PRIORITY = 100,
  CLIENT_UPDATE_FREQUENCY: UPDATE = 250,
  HEARTBEAT_FREQUENCY: HEARTBEAT = 5e3,
  TIMEOUT_PERIOD: TIMEOUT = 1e4
}) {
  Frequency = {
    PRIORITY,
    UPDATE,
    HEARTBEAT,
    TIMEOUT
  };
}
function handleRequest(request, response) {
  var content = "";
  request.on("data", (data) => content += data);
  request.on("end", () => {
    let { clientId, message } = JSON.parse(content);
    var handler;
    if (message.type === "connect") {
      let clientId2 = uuid();
      response.writeHead(200, CONTENT_TYPE_JSON);
      response.end(JSON.stringify({ type: "Welcome", clientId: clientId2 }));
    } else if (message.type === "HB") {
      let connection = getClientConnection(clientId);
      connection.response = response;
      connection.timestamp = new Date().getTime();
      if (updateInterval === null) {
        updateInterval = setTimeout(processXhrUpdates, Frequency.UPDATE);
      }
    } else if (handler = handlerFor(message)) {
      let connection = getClientConnection(clientId);
      handler(clientId, message, connection.queue);
      console.log(
        `after calling the handler, queue contains ${JSON.stringify(
          connection.queue.length
        )} records`
      );
      if (connection.queue.length > 0) {
        response.writeHead(200, CONTENT_TYPE_JSON);
        var msg = JSON.stringify(connection.queue._queue);
        connection.queue.length = 0;
        response.end(msg);
      } else {
        connection.response = response;
      }
    } else {
      console.log("server: dont know how to handle " + JSON.stringify(message));
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
        response.writeHead(200, CONTENT_TYPE_JSON);
        response.end(JSON.stringify(queue._queue));
        queue.length = 0;
        _client_xhr_connections[clientId].timestamp = currentTime;
        _client_xhr_connections[clientId].response = null;
      } else if (currentTime - timestamp > Frequency.TIMEOUT) {
        console.log(
          `We have updates and more than ${Frequency.TIMEOUT / 1e3} seconds (TIMEOUT_PERIOD) since we communicated with this client`
        );
        deadClient = true;
      } else {
        console.log(
          `processXhrHandler: client ${clientId} has ${queue.length} updates queued, nor response available, wait for next client HB `
        );
      }
    } else if (currentTime - timestamp > Frequency.HEARTBEAT) {
      console.log(
        `more than ${Frequency.HEARTBEAT / 1e3} seconds (HEARTBEAT_FREQUENCY) since we communicated with this client`
      );
      _client_xhr_connections[clientId].response = null;
      if (response) {
        response.writeHead(200, CONTENT_TYPE_JSON);
        response.end(JSON.stringify({ type: "HB", timestamp: currentTime }));
        _client_xhr_connections[clientId].timestamp = currentTime;
      } else if (currentTime - timestamp > Frequency.TIMEOUT) {
        console.log(
          `more than ${Frequency.TIMEOUT / 1e3} seconds (TIMEOUT_PERIOD) since we communicated with this client`
        );
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
export {
  configure,
  handleRequest
};
//# sourceMappingURL=xhrHandler.js.map
