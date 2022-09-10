import { ClientToServerMessage } from '@vuu-ui/data-types';
import { WebSocket } from 'ws';
import { MessageQueue } from '../messageQueue.js';
import { findHandler as handlerFor, killSubscriptions } from '../requestHandlers.js';
import { MessageConfig, VuuRequestHandler } from '../serverTypes.js';
import { TokenStore } from '../tokenStore.js';
import { updateLoop } from '../updateLoop.js';
import { uuid } from '../uuid.js';

export const websocketConnectionHandler =
  (messageConfig: MessageConfig) => (websocket: WebSocket) => {
    const { HEARTBEAT_FREQUENCY, PRIORITY_UPDATE_FREQUENCY, CLIENT_UPDATE_FREQUENCY } =
      messageConfig;
    const sessionId = uuid();

    console.log(
      `Server.websocketConnectionHandler: connection request from new client session=#${sessionId}`
    );

    const _messageQueue = new MessageQueue();

    // Note: these loops are all running per client, this will get expensive
    const HEARTBEAT = JSON.stringify({ type: 'HB', vsHostName: 'localhost' });
    const stopHeartBeats = updateLoop(
      'HeartBeat',
      websocket,
      HEARTBEAT_FREQUENCY,
      () =>
        `{"requestId":"NA","sessionId":"${sessionId}","user":"","token":"","body":{"type":"HB", "ts": 12356} }`
    );
    const stopPriorityUpdates = updateLoop(
      'Priority Updates',
      websocket,
      PRIORITY_UPDATE_FREQUENCY,
      priorityQueueReader
    );
    const stopUpdates = updateLoop(
      'Regular Updates',
      websocket,
      CLIENT_UPDATE_FREQUENCY,
      queueReader
    );

    websocket.on('message', function (msg: string) {
      const clientToServerMessage = JSON.parse(msg) as ClientToServerMessage;
      console.log(`message in ${msg}`);
      const {
        requestId,
        token,
        user,
        module,
        body: { type, ...message }
      } = clientToServerMessage;

      if (type === 'HB_RESP') {
        checkHeartBeat(sessionId, requestId, message);
      } else if (type === 'LOGIN') {
        login(sessionId, requestId, message, _messageQueue);
      } else {
        // some handlers are stateful (eg tableHandler). They must be notified
        // when connection closes (maybe with delay to allow for temp disconenction)
        const handler: VuuRequestHandler | undefined = handlerFor(type);
        if (handler) {
          handler(clientToServerMessage, _messageQueue);
        } else {
          console.log(`server: dont know how to handle ${type} message`);
        }
      }
    });

    websocket.on('close', function (msg) {
      console.log('>>> viewserver, local CONNECTION closed');

      // how do we clear up the open subscription(s)
      // keep  alist od all active handlers and notify them

      stopHeartBeats();
      stopPriorityUpdates();
      stopUpdates();

      killSubscriptions(sessionId, _messageQueue);
      // kill the update queue
    });

    function PRIORITY1(msg: { priority?: number }) {
      return msg.priority === 1;
    }

    function priorityQueueReader() {
      const queue = _messageQueue.extract(PRIORITY1);
      if (queue.length > 0) {
        return queue;
      } else {
        return null;
      }
    }

    function queueReader() {
      const queue = _messageQueue.extractAll();
      if (queue.length > 0) {
        return queue;
      } else {
        return null;
      }
    }
  };

function login(sessionId: string, requestId: string, request: any, queue: MessageQueue) {
  const { token } = request;
  if (TokenStore.hasToken(token)) {
    TokenStore.setSession(token, sessionId);
    queue.push({
      requestId,
      sessionId,
      token,
      user: 'user',
      priority: 1,
      body: {
        type: 'LOGIN_SUCCESS',
        token
      }
    });
  } else {
    console.error(`login attempt with unrecognised token`);
  }
}

function checkHeartBeat(sessionId: string, requestId: string, request: any) {
  // TODO
}
