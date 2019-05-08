import Connection from '../remote-websocket-connection';
import * as Message from '../messages.js';
import { ServerApiMessageTypes as API } from '../messages.js';
import { DataTypes } from '../../data/store/types.js';
import { msgType as Msg, createLogger, logColor } from '../constants';

const logger = createLogger('RemoteServerProxy', logColor.blue);

function partition(array, test, pass = [], fail = []) {

    for (let i = 0, len = array.length; i < len; i++) {
        (test(array[i], i) ? pass : fail).push(array[i]);
    }

    return [pass, fail];
}

// we use one ServerProxy per client (i.e per browser instance)
// This is created as a singleton in the (remote-data) view
export class ServerProxy {

    constructor(clientCallback) {
        this.connection = null;
        this.connectionStatus = 'not-connected';

        this.queuedRequests = [];
        this.pendingSubscriptionRequests = {};
        this.postMessageToClient = clientCallback;

    }

    handleMessageFromClient(message) {
        this.sendIfReady(message, this.connectionStatus === 'ready');
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

    subscribe(message) {
        const isReady = this.connectionStatus === 'ready';
        const { viewport } = message;
        const byTypeAndViewport = msg => msg.viewport === viewport && msg.type === Message.SET_VIEWPORT_RANGE;
        const [rangeMessages] = partition(this.queuedRequests, byTypeAndViewport);

        this.pendingSubscriptionRequests[viewport] = message;

        logger.log(`SUBSCRIBE to ${viewport} 
                with range ${message.range.lo} = ${message.range.hi} sent to server
                        we have ${rangeMessages.length} range messages

                ${JSON.stringify(this.queuedRequests, null, 2)}`)
        logger.log(message)

        this.sendIfReady( message, isReady);

    }

    subscribed(/* server message */ message) {
        const { viewport } = message;
        if (this.pendingSubscriptionRequests[viewport]) {

            const request = this.pendingSubscriptionRequests[viewport];
            // const {table, columns, sort, filter, groupBy} = request;
            let { range } = request;
            logger.log(`<handleMessageFromServer> SUBSCRIBED create subscription range ${range.lo} - ${range.hi}`)

            this.pendingSubscriptionRequests[viewport] = undefined;

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
        this.postMessageToClient({ data: { type: 'connection-status', status: 'ready', connectionId } });
    }

    sendMessageToServer(message) {
        const { clientId } = this.connection;
        //const { requestId = this.connection.nextRequestId() } = message;
        // TODO do we need the requestId ?
        // const serverMessage = this.server.serialize(message, clientId, requestId);
        this.connection.send({ clientId, message });
    }

    handleMessageFromServer(message) {
        const { type, viewport } = message;

        switch (type) {

            case Message.SNAPSHOT:
                logger.log(`<handleMessageFromServer>`, message)
                const { data } = message;
                // const rows = subscription.putSnapshot(data);
                if (data.rows.length) {
                    this.postMessageToClient({
                        data: {
                            type: DataTypes.ROW_DATA,
                            viewport,
                            rowData: {
                                ...data,
                                data: data.rows
                            }
                        }
                    });
                }
                break;

            case Message.SUBSCRIBED:
                this.subscribed(message);
                break;

            case Message.FILTER_DATA:
            case Message.SEARCH_DATA:
                const { data: filterData } = message;
                // const { rowset: data } = subscription.putData(type, filterData);

                // if (data.length || filterData.size === 0) {
                this.postMessageToClient({
                    data: {
                        type,
                        viewport,
                        [type]: filterData
                    },
                });
                // }

                break;

            default:
                this.postMessageToClient({ data: message });

        }

    }

}