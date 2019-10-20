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

    constructor(connection) {
        logger.log(`ServerProxy constructor`)
        this.connection = connection;
        this.queuedRequests = [];
        this.viewportStatus = {};
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

    resubscribeAll(){
        logger.log(`resubscribe all`)
        for (let [viewport, {request}] of Object.entries(this.viewportStatus)) {
            this.sendMessageToServer({
                type: API.addSubscription,
                ...request
            });
        }
    }

    disconnected(){
        logger.log(`disconnected`);
        for (let [viewport, {callback}] of Object.entries(this.viewportStatus)) {
            callback({
                rows: [],
                size: 0,
                range: {lo:0, hi:0}
            })
        }
    }

    subscribe(message, callback) {
        const isReady = this.connection !== null;
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