import MessageQueue from "../message-queue.js";
import { findHandler as handlerFor, killSubscriptions } from "../requestHandlers.js";
import { updateLoop } from "../updateLoop.js";
import { uuid } from "../uuid.js";
import { TokenStore } from "../tokenStore.js";
const requestHandler = (options, logger) => (localWebsocketConnection) => {
  const { HEARTBEAT_FREQUENCY, PRIORITY_UPDATE_FREQUENCY, CLIENT_UPDATE_FREQUENCY } = options;
  const sessionId = uuid();
  console.log(
    `Server.websocketRequestHandler: connection request from new client session=#${sessionId}`
  );
  const _update_queue = new MessageQueue();
  const HEARTBEAT = JSON.stringify({ type: "HB", vsHostName: "localhost" });
  const stopHeartBeats = updateLoop(
    "HeartBeat",
    localWebsocketConnection,
    HEARTBEAT_FREQUENCY,
    () => `{"requestId":"NA","sessionId":"${sessionId}","user":"","token":"","body":{"type":"HB", "ts": 12356} }`
  );
  const stopPriorityUpdates = updateLoop(
    "Priority Updates",
    localWebsocketConnection,
    PRIORITY_UPDATE_FREQUENCY,
    priorityQueueReader
  );
  const stopUpdates = updateLoop(
    "Regular Updates",
    localWebsocketConnection,
    CLIENT_UPDATE_FREQUENCY,
    queueReader
  );
  localWebsocketConnection.on("message", function(msg) {
    const json = JSON.parse(msg);
    console.log(`message in ${msg}`);
    const {
      requestId,
      token,
      user,
      module,
      body: { type, ...message }
    } = json;
    if (type === "HB_RESP") {
      checkHeartBeat(sessionId, requestId, message);
    } else if (type === "LOGIN") {
      login(sessionId, requestId, message, _update_queue);
    } else {
      const handler = handlerFor(type);
      if (handler) {
        handler(sessionId, requestId, message, _update_queue);
      } else {
        console.log(`server: dont know how to handle ${type} message`);
      }
    }
  });
  localWebsocketConnection.on("close", function(msg) {
    console.log(">>> viewserver, local CONNECTION closed");
    stopHeartBeats();
    stopPriorityUpdates();
    stopUpdates();
    killSubscriptions(sessionId, _update_queue);
  });
  function PRIORITY1(msg) {
    return msg.priority === 1;
  }
  function priorityQueueReader() {
    const queue = _update_queue.extract(PRIORITY1);
    if (queue.length > 0) {
      return queue;
    } else {
      return null;
    }
  }
  function queueReader() {
    const queue = _update_queue.extractAll();
    if (queue.length > 0) {
      return queue;
    } else {
      return null;
    }
  }
};
function login(sessionId, requestId, request, queue) {
  const { token } = request;
  if (TokenStore.hasToken(token)) {
    TokenStore.setSession(token, sessionId);
    queue.push({
      requestId,
      sessionId,
      token,
      user: "user",
      priority: 1,
      body: {
        type: "LOGIN_SUCCESS",
        token
      }
    });
  } else {
    console.error(`login attempt with unrecognised token`);
  }
}
function checkHeartBeat(sessionId, requestId, request, queue) {
  console.log("heartbeat received");
}
export {
  requestHandler
};
//# sourceMappingURL=viewserverRequestHandler.js.map
