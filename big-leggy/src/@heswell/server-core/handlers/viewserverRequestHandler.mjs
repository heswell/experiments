import MessageQueue from '../MessageQueue';
import { findHandler as handlerFor, killSubscriptions } from '../requestHandlers';
import { updateLoop } from '../updateLoop';

// we can have a separate clientId for XHR requests
let _clientId = 0;

export const requestHandler = (options, logger) => (localWebsocketConnection) => {

    const { HEARTBEAT_FREQUENCY, PRIORITY_UPDATE_FREQUENCY, CLIENT_UPDATE_FREQUENCY } = options;

    let server_clientId = ++_clientId;

    console.log(`Server.websocketRequestHandler: connection request from new client #${server_clientId}`);

    localWebsocketConnection.send(JSON.stringify(
        { type: 'Welcome', clientId: ++_clientId }
    ));

    const _update_queue = new MessageQueue();

    // Note: these loops are all running per client, this will get expensive
    const HEARTBEAT = JSON.stringify({ type: 'HB', vsHostName: 'localhost' });
    const stopHeartBeats = updateLoop('HeartBeat', localWebsocketConnection, HEARTBEAT_FREQUENCY, () => HEARTBEAT);
    const stopPriorityUpdates = updateLoop('Priority Updates', localWebsocketConnection, PRIORITY_UPDATE_FREQUENCY, priorityQueueReader);
    const stopUpdates = updateLoop('Regular Updates', localWebsocketConnection, CLIENT_UPDATE_FREQUENCY, queueReader);

    localWebsocketConnection.on('message', function (msg) {

        const json = JSON.parse(msg);
        const message = json.message;
        const msgType = message.type;

        // some handlers are stateful (eg tableHandler). They must be notified 
        // when connection closes (maybe with delay to allow for temp disconenction)
        const handler = handlerFor(msgType);

        if (handler) {
            console.log(`JSON.stringify(message,null,2)`)
            handler(server_clientId, message, _update_queue);
        } else {
            console.log('server: dont know how to handle ' + msg);
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

    function PRIORITY1(msg) { return msg.priority === 1 }

    function priorityQueueReader(PRI) {
        const queue = _update_queue.extract(PRIORITY1);
        if (queue.length > 0) {
            const msg = JSON.stringify(queue);
            //logger.output1(`\n[${new Date().toISOString().slice(11,23)}] <<<<<   ${msg}`);
            return msg;
        } else {
            return null;
        }
    }

    function queueReader() {
        if (_update_queue.length > 0) {
            return JSON.stringify(_update_queue.queue);
        } else {
            return null;
        }
    }

};
