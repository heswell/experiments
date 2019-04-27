import Subscription from './worker-hosted/subscription.mjs';
import Connection from './remote-websocket-connection';
import * as Message from './messages.js';
import {ServerApiMessageTypes as API} from './messages.js';
import {DataTypes} from '../data/store/types.js';
import {NULL_RANGE} from '../data/store/rangeUtils.js';
import {msgType as Msg, createLogger, logColor} from './constants';

const logger = createLogger('RemoteServerProxy', logColor.blue);

function partition(array, test, pass = [], fail = []) {

    for (let i = 0, len = array.length; i < len; i++) {
        (test(array[i], i) ? pass : fail).push(array[i]);
    }

    return [pass, fail];
}

export class ServerProxy {

    constructor(clientCallback) {
        this.connection = null;
        this.connectionStatus = 'not-connected';

        this.queuedRequests = [];
        this.subscriptions = {};
        this.pendingSubscriptionRequests = {};
        this.postMessageToClient = clientCallback;

    }

    handleMessageFromClient(message) {

        const { type, viewport } = message;
        const isReady = this.connectionStatus === 'ready';
        let subscription;

        switch (type) {

            case Msg.setViewRange:
                //TODO drop buffering if we are scrolling faster than buffer can keep up
                if (subscription = this.subscriptions[viewport]) {
                    const { range, dataType } = message;
                    // const { size, offset } = subscription[dataType];
                    this.sendMessageToServer({
                        type: Msg.setViewRange,
                        ...message,
                        dataType,
                        range: { ...range, bufferSize: 0 }
                    });
                    const rows = subscription.putRange(message.range, dataType);
                    // if (rows.length) {
                    //     logger.log(`<handleMessageFromClient -> postMessage> ${dataType} rows from cache ${rows.length ? rows[0][0]: null} - ${rows.length ? rows[rows.length-1][0]: null}`);
                    //     this.postMessageToClient({ data: { type: dataType, viewport, [dataType]: { data: rows, size, offset, range } } });
                    // }
                } else {
                    console.log(`%c setViewRange, no subscription`,'background-color: brown;color: cyan')
                    this.queuedRequests.push(message);
                }

                break;

            case Msg.expandGroup:
            case Msg.collapseGroup:

                this.sendIfReady(message, this.connectionStatus === 'ready');

                if (subscription = this.subscriptions[viewport]) {
                    const groupRow = subscription.toggleGroupNode(message.groupKey);
                    const {IDX, DEPTH} = subscription.meta;
                    const updates = [[groupRow[IDX], DEPTH, groupRow[DEPTH]]];
                    this.postMessageToClient({ data: { type: 'update', viewport, updates } });
                }

                break;

            case Message.UNSUBSCRIBE:

                this.sendIfReady(message, isReady);
                delete this.subscriptions[viewport];

                break;

            case Message.GROUP_BY:
            logger.log(`<GROUP_BY>`, message)
                if (subscription = this.subscriptions[viewport]) {
                    subscription.clear();
                }
            case Message.SET_GROUP_STATE:
            case Message.TABLE_LIST:
            case Message.COLUMN_LIST:
            case Message.SORT:
            case Message.FILTER:
            case Message.SELECT:
                this.sendIfReady(message, isReady);

                break;

            case Message.GET_FILTER_DATA:
                //TODO expand range, so we prepopulate subscription cache
                // console.log(`%c>>>${new Date().toISOString().slice(11,23)} handleMesageFromClient '${Message.GET_FILTER_DATA}' `, 'color:green;font-weight:bold');
                this.sendIfReady(message, isReady);
                if (subscription = this.subscriptions[viewport]) {
                    subscription.reset(DataTypes.FILTER_DATA, message.range);
                }
                break;

            case Message.MODIFY_SUBSCRIPTION:

                if (subscription = this.subscriptions[viewport]) {

                    this.sendIfReady(message, isReady);

                    if (message.sortCriteria) {
                        subscription.reset(DataTypes.ROW_DATA, message.range);
                    } else if (message.range) {
                        subscription.putRange(message.range);
                    }

                    // We should store all chnaged attributes on the subscription here. There will be times
                    // when we need to know the attributes of the subscription in order to correctly
                    // interpret the data received.
                    if (message.groupBy) {
                        subscription.groupBy = message.groupBy;
                    }
                }

                break;

            default:
                logger.log(`%cServerProxy.handleMesageFromClient NOT HANDLED ${JSON.stringify(message)}`, 'background-color:green;color:white');

        }

    }

    sendIfReady(message, isReady) {
        if (isReady) {
            this.sendMessageToServer(message);
        } else {
            this.queuedRequests.push(message);
        }

        return isReady;

    }

    // if we're going to support multiple connections, we need to save them against connectionIs
    async connect({connectionString, connectionId=0}) {

        logger.log(`<connect> connectionString: ${connectionString} connectionId: ${connectionId}`)
        this.connectionStatus = 'connecting';
        this.connection = await Connection.connect(connectionString, msg => this.handleMessageFromServer(msg));
        this.onReady(connectionId);
    }

    subscribe(/* client message */ message ){
        const isReady = this.connectionStatus === 'ready';
        const { viewport } = message;

        if (message) {
            const byTypeAndViewport = msg => msg.viewport === viewport && msg.type === Message.SET_VIEWPORT_RANGE;
            const [rangeMessages] = partition(this.queuedRequests, byTypeAndViewport);

            const { range = NULL_RANGE } = message;
            this.pendingSubscriptionRequests[viewport] = message;
            logger.log(`SUBSCRIBE to ${viewport} 
                with range ${range.lo} = ${range.hi} stored
                        range ${range.lo} = ${range.hi === 0 ? 10 : range.hi} sent to server
                        we have ${rangeMessages.length} range messages

                ${JSON.stringify(this.queuedRequests,null,2)}`)
                logger.log(message)

            this.sendIfReady({
                ...message,
                range: {
                    lo: 0,
                    hi: range.hi || 10, // where should this come from. This will cause key errors if bigger than viewport
                    bufferSize: 0
                }
            }, isReady);
        }

    }

    subscribed(/* server message */ message){
        const {viewport} = message;
        if (this.pendingSubscriptionRequests[viewport]) {

            const { size, offset } = message;
            const request = this.pendingSubscriptionRequests[viewport];
            // const {table, columns, sort, filter, groupBy} = request;
            let { range, columns } = request;
            logger.log(`<handleMessageFromServer> SUBSCRIBED create subscription range ${range.lo} - ${range.hi}`)
            const subscription = this.subscriptions[viewport] = new Subscription({
                columns,
                range,
                size,
                offset,
            });

            this.pendingSubscriptionRequests[viewport] = undefined;

            const byViewport = vp => item => item.viewport === vp;
            const byMessageType = msg => msg.type === Message.SET_VIEWPORT_RANGE;
            const [messagesForThisViewport, messagesForOtherViewports] = partition(this.queuedRequests, byViewport(viewport));
            const [rangeMessages, otherMessages] = partition(messagesForThisViewport, byMessageType);

            this.queuedRequests = messagesForOtherViewports;
            rangeMessages.forEach(msg => {

                range = msg.range;

                const rows = subscription.putRange(range);

                if (rows.length) {
                    // is it ever likely that we will have data immediately following subscription ?
                    //onsole.log(`ServerProxy.subscribed ${rows.length} rows in range, following queued message handling`);
                    this.postMessageToClient({ data: { type: DataTypes.ROW_DATA, viewport, rowData: { data: rows, size } } });
                }

            });

            if (otherMessages.length) {
                console.log(`we have ${otherMessages.length} messages still to process`);
            }

            // send a widened range request to populate buffer
            this.sendMessageToServer({
                type: Message.SET_VIEWPORT_RANGE,
                dataType: DataTypes.ROW_DATA,
                viewport,
                range: {
                    lo: Math.max(0, range.lo),
                    hi: range.hi
                }
            });

        }

    }

    onReady(connectionId){
        this.connectionStatus = 'ready';
        // messages which have no dependency on previous subscription
        logger.log(`%c onReady ${JSON.stringify(this.queuedRequests)}`,'background-color: brown;color: cyan')

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
        this.connection.send({clientId, message});
    }

    handleMessageFromServer(message) {
        let subscription;
        const { type, viewport } = message;

        switch (type) {

            case Message.DATA:

                this.processData(message.data);

                break;

            case Message.SNAPSHOT:
                logger.log(`<handleMessageFromServer>`,message)
                if (subscription = this.subscriptions[viewport]) {
                    const { data } = message;
                    const rows = subscription.putSnapshot(data);
                    if (rows.length) {
                        this.postMessageToClient({ data: { type: DataTypes.ROW_DATA, viewport, rowData: { ...data, data: rows } } });
                    } else {
                        logger.log(`no rows after putSnapshot`)
                    }
                }
                break;

            case Message.SUBSCRIBED:
                this.subscribed(message);
                break;

            case Message.FILTER_DATA:
            case Message.SEARCH_DATA:
                if (subscription = this.subscriptions[viewport]) {
                    const { filterData } = message;

                    const { rowset: data } = subscription.putData(type, filterData);

                    if (data.length || filterData.size === 0) {
                        this.postMessageToClient({
                            data: {
                                type,
                                viewport,
                                [type]: {
                                    ...filterData,
                                    data
                                }
                            },
                        });
                    }
                }

                break;

            default:
                this.postMessageToClient({ data: message });

        }

    }

    // data is an array of batches where each batch contains the set of 
    // data updates for one viewport
    processData(data) {

        logger.log(`<processData>`,data)

        data.forEach(batch => {

            const { viewport, size, offset, rows, updates: rowUpdates } = batch;
            const subscription = this.subscriptions[viewport];

            if (subscription === undefined) {
                console.warn(`ServerProxy.processData no subscription for viewport ${viewport}`);
            } else {
                const lastSize = subscription.size;

                if (typeof size === 'number') {
                    subscription.size = size;
                }
                //TODO rows should be bundled into a data structure with range, offset, selected, like filter and search results
                let { rowset, updates } = rows
                    ? subscription.putRows(rows, offset)
                    : subscription.putUpdates(rowUpdates);

                if (rowset && rowset.length) {
                    const { range } = subscription.rowData;
                    this.postMessageToClient({ data: { type: DataTypes.ROW_DATA, viewport, rowData: { data: rowset, size, range, offset } } });

                } else if (updates && updates.length) {
                    this.postMessageToClient({ data: { type: 'update', viewport, updates, size } });
                } else if (size !== undefined && size !== lastSize) {
                    // size undefined if we have received an update where no updated rows are in the viewport
                    // post a size update - only the scrollbar will reflect the change
                    this.postMessageToClient({ data: { type: 'size', viewport, size } });
                }

            }

        });

    }

}