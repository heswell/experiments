import Connection from '../../remote-websocket-connection';
import * as Message from './messages.js';
import { ServerApiMessageTypes as API } from '../../messages.js';
import { createLogger, logColor } from '@heswell/utils';

const logger = createLogger('ViewsServerProxy', logColor.blue);

function partition(array, test, pass = [], fail = []) {

    for (let i = 0, len = array.length; i < len; i++) {
        (test(array[i], i) ? pass : fail).push(array[i]);
    }

    return [pass, fail];
}

/*
    query: (type, params = null) => new Promise((resolve, reject) => {
      const requestId = uuid.v1();
      postMessage({ requestId, type, params });
      const timeoutHandle = setTimeout(() => {
        delete pendingPromises[requestId];
        reject(Error('query timed out waiting for server response'));
      }, 5000);
      pendingPromises[requestId] = { resolve, reject, timeoutHandle };
    })

    */
// we use one ServerProxy per client (i.e per browser instance)
// This is created as a singleton in the (remote-data) view
// TODO don'r we need to create one per server connected to ?
export class ServerProxy {

    constructor() {
        this.connection = null;
        this.connectionStatus = 'not-connected';

        this.queuedRequests = [];
        this.viewportStatus = {};
        this.postMessageToClient = null;

    }

    handleMessageFromClient(message) {
        this.sendIfReady(message, this.viewportStatus[message.viewport].status === 'subscribed');
    }

    sendIfReady(message, isReady) {
        // TODO implement the message queuing in remote data view
        if (isReady) {
            this.sendMessageToServer(message);
        } else {
            this.queuedRequests.push(message);
        }

        return isReady;

    }

    // if we're going to support multiple connections, we need to save them against connectionIs
    async connect({ connectionString, connectionId = 0 }) {

        logger.log(`<connect> connectionString: ${connectionString} connectionId: ${connectionId}`)
        this.connectionStatus = 'connecting';
        this.connection = await Connection.connect(connectionString, msg => this.handleMessageFromServer(msg));
        this.onReady(connectionId);
    }

    subscribe(message, callback) {
        const isReady = this.connectionStatus === 'ready';
        const { viewport } = message;
        this.viewportStatus[viewport] = {
            status: 'subscribing',
            request: message,
            callback
        }
        this.sendIfReady( {
            type: API.addSubscription,
            ...message
        }, isReady);
    }

    subscribed(/* server message */ message) {
        const { viewport } = message;
        if (this.viewportStatus[viewport]) {

            const {request, callback} = this.viewportStatus[viewport];
            // const {table, columns, sort, filter, groupBy} = request;
            let { range } = request;
            logger.log(`<handleMessageFromServer> SUBSCRIBED create subscription range ${range.lo} - ${range.hi}`)

            this.viewportStatus[viewport].status = 'subscribed';

            const byViewport = vp => item => item.viewport === vp;
            const byMessageType = msg => msg.type === Message.SET_VIEWPORT_RANGE;
            const [messagesForThisViewport, messagesForOtherViewports] = partition(this.queuedRequests, byViewport(viewport));
            const [rangeMessages, otherMessages] = partition(messagesForThisViewport, byMessageType);

            this.queuedRequests = messagesForOtherViewports;
            rangeMessages.forEach(msg => {

                range = msg.range;

            });

            if (otherMessages.length) {
                console.log(`we have ${otherMessages.length} messages still to process`);
            }

        }

    }

    onReady(connectionId) {
        this.connectionStatus = 'ready';
        // messages which have no dependency on previous subscription
        logger.log(`%c onReady ${JSON.stringify(this.queuedRequests)}`, 'background-color: brown;color: cyan')

        const byReadyToSendStatus = msg => msg.viewport === undefined || msg.type === API.addSubscription;
        const [readyToSend, remainingMessages] = partition(this.queuedRequests, byReadyToSendStatus);
        // TODO roll setViewRange messages into subscribe messages
        readyToSend.forEach(msg => this.sendMessageToServer(msg));
        this.queuedRequests = remainingMessages;
        //this.postMessageToClient({ type: 'connection-status', status: 'ready', connectionId });
    }

    sendMessageToServer(message) {
        const { clientId } = this.connection;
        this.connection.send({ clientId, message });
    }

    handleMessageFromServer(message) {
        const { type, viewport } = message;

        if (viewport){
            const {callback: postMessageToClient} = this.viewportStatus[viewport];

            switch (type) {
    
                case Message.SUBSCRIBED:
                    this.subscribed(message);
                    break;
    
                case Message.FILTER_DATA:
                case Message.SEARCH_DATA:
                    const { data: filterData } = message;
                    // const { rowset: data } = subscription.putData(type, filterData);
    
                    // if (data.length || filterData.size === 0) {
                    postMessageToClient({
                        type,
                        viewport,
                        [type]: filterData
                    });
                    // }
    
                    break;
                    
                case 'rowset':    
                case 'selected':
                case Message.SNAPSHOT:{
                    postMessageToClient(message.data);
                }
                    break;
                case 'update':
                    postMessageToClient(message);
                    break;
                default:
                    if (type !== 'update'){
                        console.log(`[ServerProxy] message received ${JSON.stringify(message)}`)
                    }
                    // postMessageToClient(message);
    
            }
    
        } else {
            console.log(`message with no viewport ${JSON.stringify(message)}`)
        }

    }

}