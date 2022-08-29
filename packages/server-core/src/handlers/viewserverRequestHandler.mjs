import MessageQueue from '../message-queue.mjs';
import { findHandler as handlerFor, killSubscriptions } from '../requestHandlers.mjs';
import { updateLoop } from '../updateLoop.mjs';

// we can have a separate clientId for XHR requests
let _clientId = 0;

export const requestHandler = (options, logger) => (localWebsocketConnection) => {
  const { HEARTBEAT_FREQUENCY, PRIORITY_UPDATE_FREQUENCY, CLIENT_UPDATE_FREQUENCY } = options;

  let server_clientId = ++_clientId;

  console.log(
    `Server.websocketRequestHandler: connection request from new client #${server_clientId}`
  );

  // localWebsocketConnection.send(JSON.stringify({ type: 'Welcome', clientId: ++_clientId }));

  const _update_queue = new MessageQueue();

  // Note: these loops are all running per client, this will get expensive
  const HEARTBEAT = JSON.stringify({ type: 'HB', vsHostName: 'localhost' });
  const stopHeartBeats = updateLoop(
    'HeartBeat',
    localWebsocketConnection,
    HEARTBEAT_FREQUENCY,
    () =>
      `{"requestId":"NA","sessionId":"","user":"","token":"","body":{"type":"HB", "ts": 12356} }`
  );
  const stopPriorityUpdates = updateLoop(
    'Priority Updates',
    localWebsocketConnection,
    PRIORITY_UPDATE_FREQUENCY,
    priorityQueueReader
  );
  const stopUpdates = updateLoop(
    'Regular Updates',
    localWebsocketConnection,
    CLIENT_UPDATE_FREQUENCY,
    queueReader
  );

  localWebsocketConnection.on('message', function (msg) {
    const json = JSON.parse(msg);
    console.log(`message in ${msg}`);
    const {
      requestId,
      token,
      user,
      module,
      body: { type, ...message }
    } = json;
    console.log(`${token} >>> ${type}  ${JSON.stringify(message)}`);

    // some handlers are stateful (eg tableHandler). They must be notified
    // when connection closes (maybe with delay to allow for temp disconenction)
    const handler = handlerFor(type);

    if (handler) {
      handler(server_clientId, message, _update_queue);
    } else {
      console.log(`server: dont know how to handle ${type} message`);
    }
  });

  localWebsocketConnection.on('close', function (msg) {
    console.log('>>> viewserver, local CONNECTION closed');

    // how do we clear up the open subscription(s)
    // keep  alist od all active handlers and notify them

    stopHeartBeats();
    stopPriorityUpdates();
    stopUpdates();

    killSubscriptions(server_clientId, _update_queue);
    // kill the update queue
  });

  function PRIORITY1(msg) {
    return msg.priority === 1;
  }

  function priorityQueueReader() {
    const queue = _update_queue.extract(PRIORITY1);
    if (queue.length > 0) {
      // queue.forEach((msg) => {
      //   if (msg.data && msg.data.range) {
      //     console.log(`[${Date.now()}]<<<<<<<<< ${msg.type} ${JSON.stringify(msg.data.range)}`);
      //   }
      // });
      console.log({ queue });
      // const msg = JSON.stringify(queue);
      return queue;
    } else {
      return null;
    }
  }

  function queueReader() {
    if (_update_queue.length > 0) {
      const msg = JSON.stringify(_update_queue.queue);
      //onsole.log(`\n[${new Date().toISOString().slice(11,23)}] <<<<<   ${msg}`);
      return msg;
    } else {
      return null;
    }
  }
};
