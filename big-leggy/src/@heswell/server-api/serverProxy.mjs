import Connection from './connection.mjs';
import Subscription from './subscription.mjs';
import * as Message from './messages.js';
import {DataTypes} from '../data/store/types.js';
import {NULL_RANGE} from '../data/store/rangeUtils.js';

const serverModule = process.env.SERVER_MODULE || '/server-api/dist/viewserver.js';
console.log(`[ServerProxy] serverModule = ${serverModule}`)
const PLAIN = 'color: black; font-weight: normal';
const BLUE = 'color: blue; font-weight: bold';
const MSG_FROM_CLIENT = '<== C';
const MSG_TO_CLIENT = '==> C';
const MSG_TO_SERVER = '==> S';
const MSG_FROM_SERVER = '<== S';

let asyncServerModule;

const BUFFER_SIZE = 100;

let _windowId = 1;

function windowId() {
    return _windowId++;
}

const BUFFER_ROWS = 100;

function partition(array, test, pass = [], fail = []) {

    for (let i = 0, len = array.length; i < len; i++) {
        (test(array[i], i) ? pass : fail).push(array[i]);
    }

    return [pass, fail];
}

export class ServerProxy {

    constructor(postMessage) {
        this.server = null;
        this.connection = null;
        this.connectionStatus = 'not-connected';

        this.queuedRequests = [];
        this.subscriptions = {};
        this.pendingSubscriptionRequests = {};

        Promise.resolve().then(() => {
            console.log(`[ServerProxy.constructor]   ==> identity`);
            postMessage({ data: { type: 'identify', clientId: windowId() } });
        });

        // tidy this up
        this.postMessage = message => {
            print(message.data, MSG_TO_CLIENT);
            postMessage(message);
        }

    }

    toString(){
        return `ServerProxy: ${this.connectionStatus}`
    }

    handleMessageFromClient(message) {

        const { type, viewport } = message;
        const isReady = this.connectionStatus === 'ready';
        let subscription;
        console.log(JSON.stringify(message))
        print(message, MSG_FROM_CLIENT);

        switch (type) {

            case Message.CONNECT:
                this.connect(message);
                break;

            case Message.SUBSCRIBE:
                this.subscribe(message)
                break;

            case Message.SET_VIEWPORT_RANGE:
                //TODO drop buffering if we are scrolling faster than buffer can keep up
                if (subscription = this.subscriptions[viewport]) {
                    console.log(`%c setViewRange, we have a subscription`,'background-color: brown;color: cyan')
                    const { bufferSize } = subscription;
                    const { range, dataType } = message;
                    const { size, offset } = subscription[dataType];
                    this.sendMessageToServer({
                        type: Message.SET_VIEWPORT_RANGE,
                        ...message,
                        dataType,
                        range: { ...range, bufferSize }
                    });
                    const rows = subscription.putRange(message.range, dataType);
                    if (rows.length) {
                        console.log(`%cserverProxy emit<${dataType}> rows from cache ${rows.length ? rows[0][0]: null} - ${rows.length ? rows[rows.length-1][0]: null}`,'color:red');
                        // never send back selectedIndices from cache, they will often be stale
                        this.postMessage({ data: { type: dataType, viewport, [dataType]: { data: rows, size, offset, range } } });
                    }
                } else {
                    console.log(`%c setViewRange, no subscription`,'background-color: brown;color: cyan')
                    this.queuedRequests.push(message);
                }

                break;

            case Message.EXPAND_GROUP:
            case Message.COLLAPSE_GROUP:

                this.sendIfReady(message, this.connectionStatus === 'ready');

                if (subscription = this.subscriptions[viewport]) {
                    const groupRow = subscription.toggleGroupNode(message.groupKey);
                    const {IDX, DEPTH} = subscription.meta;
                    const updates = [[groupRow[IDX], DEPTH, groupRow[DEPTH]]];
                    this.postMessage({ data: { type: 'update', viewport, updates } });
                }

                break;

            case Message.UNSUBSCRIBE:

                this.sendIfReady(message, isReady);
                delete this.subscriptions[viewport];

                break;

            case Message.GROUP_BY:
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
                console.warn(`%cServerProxy.handleMesageFromClient NOT HANDLED ${JSON.stringify(message)}`, 'background-color:green;color:white');

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
    connect({connectionString, connectionId=0}) {

        console.log(`[ServerProxy.connect] connectionString: ${connectionString} connectionId: ${connectionId}`)
        this.connectionStatus = 'connecting';

        const module = asyncServerModule ||
            (asyncServerModule = import(/* webpackIgnore: true */ serverModule)
                .catch(err => console.log(`failed to load server ${err}`)))

        module.then(serverModule => {
            const Server = serverModule.default;
            const server = this.server = new Server();

            Connection.connect(connectionString).then(connection => {
                // shouldn't we read connection status from the connection object itself
                this.connection = connection;

                // call the server to group messages by viewport, then invoke each batch with the subscription for that viewport
                connection.on('message', (evtName, msg) => {
                    return this.receiveMessageFromServer(msg);
                });

                if (server.connectionPipeline) {
                    const [first, ...rest] = server.connectionPipeline;
                    rest.reduce((result, next) => result
                        .then(next), first(connection))
                        .then(() => this.onReady(connectionId));
                } else {
                    this.onReady(connectionId);
                }

            });

        });
    }

    subscribe(/* client message */ message ){
        const isReady = this.connectionStatus === 'ready';
        const { viewport } = message;

        if (message) {
            const byTypeAndViewport = msg => msg.viewport === viewport && msg.type === Message.SET_VIEWPORT_RANGE;
            const [rangeMessages] = partition(this.queuedRequests, byTypeAndViewport);

            const { range = NULL_RANGE } = message;
            this.pendingSubscriptionRequests[viewport] = message;
            console.log(`%c SUBSCRIBE to ${viewport} 
                with range ${range.lo} = ${range.hi} stored
                        range ${range.lo} = ${range.hi === 0 ? 10 : range.hi} sent to server
                        we have ${rangeMessages.length} range messages

                ${JSON.stringify(this.queuedRequests,null,2)}`,'background-color: brown;color: cyan')
                console.log(message)

            this.sendIfReady({
                ...message,
                range: {
                    lo: 0,
                    hi: range.hi || 10, // where should this come from. This will cause key errors if bigger than viewport
                    bufferSize: BUFFER_SIZE
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
            console.log(`%c[ServerProxy.handleMessageFromServer] SUBSCRIBED create subscription range ${range.lo} - ${range.hi}`,'background-color: yellow')
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
                    this.postMessage({ data: { type: DataTypes.ROW_DATA, viewport, rowData: { data: rows, size } } });
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
                    lo: Math.max(0, range.lo - BUFFER_ROWS),
                    hi: range.hi + BUFFER_ROWS
                }
            });

        }

    }

    onReady(connectionId){
        this.connectionStatus = 'ready';
        // messages which have no dependency on previous subscription
        console.log(`%c onReady ${JSON.stringify(this.queuedRequests)}`,'background-color: brown;color: cyan')

        const byReadyToSendStatus = msg => msg.viewport === undefined || msg.type === Message.SUBSCRIBE;
        const [readyToSend, remainingMessages] = partition(this.queuedRequests, byReadyToSendStatus);
        // TODO roll setViewRange messages into subscribe messages
        readyToSend.forEach(msg => this.sendMessageToServer(msg));
        this.queuedRequests = remainingMessages;
        this.postMessage({ data: { type: 'connection-status', status: 'ready', connectionId } });
    }

    sendMessageToServer(message) {
        const { clientId } = this.connection;
        const { requestId = this.connection.nextRequestId() } = message;
        const serverMessage = this.server.serialize(message, clientId, requestId);
        if (serverMessage === null) {
            console.warn(`[ServerProxy sendMessageToServer] ${JSON.stringify(message)} not supported by server`);
        } else {
            print(message, MSG_TO_SERVER);
            this.connection.send(serverMessage);
        }
    }

    receiveMessageFromServer(message) {

        // onsole.groupCollapsed(`receiveMessageFromServer`);
        // onsole.log(message);
        // onsole.groupEnd();
        print(message, MSG_FROM_SERVER);
        const { messageHandlers = {}, customMessageTypes = {} } = this.server;

        // feels wrong to pass all subscriptions to server here - should really pass just the subscription
        // for the message. But as a payload can include messages for more than one subscription, we would
        // first have to ask server to group the messages by viewport. Some messages are not associated
        // with any viewport
        const messageFromServer = this.server.deserialize(message, this.subscriptions);
        if (messageFromServer) {

            const { type } = messageFromServer;

            // messages that can be handled entirely by the server - e.g. Heartbeat
            if (messageHandlers[type]) {
                messageHandlers[type](this.connection, message);
            } else if (customMessageTypes[type]) {
                // can be used to chain message requests/responses e.g. a server initiating a LOGIN 
                // request can reister a listener for the LOGIN_RESPONSE
                this.connection.emit(type, message);
            } else {
                this.handleMessageFromServer(messageFromServer);
            }
        } else {
            console.log(`unable to deserialize message ${JSON.stringify(message)}`);
        }

    }

    handleMessageFromServer(message) {

        let subscription;
        const { type, viewport } = message;

        switch (type) {

            case Message.DATA:

                this.processData(message.data);

                break;

            case Message.SNAPSHOT:
                if (subscription = this.subscriptions[viewport]) {
                    const { data } = message;
                    const rows = subscription.putSnapshot(data);
                    if (rows.length) {
                        this.postMessage({ data: { type: DataTypes.ROW_DATA, viewport, rowData: { ...data, data: rows } } });
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

                    // if (dataType === DataTypes.FILTER_BINS){
                    //     this.postMessage( {
                    //         data: {
                    //             type: DataTypes.FILTER_BINS,
                    //             viewport,
                    //             [dataType]: filterData
                    //         }
                    //     } );

                    /*} else */ if (data.length || filterData.size === 0) {
                        this.postMessage({
                            data: {
                                type,
                                viewport,
                                [type]: {
                                    ...filterData,
                                    data
                                }
                            }
                        });
                    }
                }

                break;

            default:
                this.postMessage({ data: message });

        }

    }

    // data is an array of batches where each batch contains the set of 
    // data updates for one viewport
    processData(data) {
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
                    this.postMessage({ data: { type: DataTypes.ROW_DATA, viewport, rowData: { data: rowset, size, range, offset } } });

                } else if (updates && updates.length) {
                    this.postMessage({ data: { type: 'update', viewport, updates, size } });
                } else if (size !== undefined && size !== lastSize) {
                    // size undefined if we have received an update where no updated rows are in the viewport
                    // post a size update - only the scrollbar will reflect the change
                    this.postMessage({ data: { type: 'size', viewport, size } });
                }

            }

        });

    }

}

function print(message, direction, method=null, color=BLUE){
    console.log(`%c[ServerProxy${method === null ? '' : '.' + method}] %c${direction}  ${message.type} %c${messageToString(message)}`, PLAIN, color, PLAIN);
}

function messageToString(message){
    const {requestId='', viewport=''} = message;
    switch (message.type){
        case Message.SET_VIEWPORT_RANGE:
            return `${requestId} viewport ${viewport} range: ${message.range.lo} - ${message.range.hi}`;
        case Message.SUBSCRIBE:
        case Message.SUBSCRIBED:
            return `${requestId} vp:${message.viewport}`;
        case 'rowset':
        case Message.SNAPSHOT:
            return `${message.data.rows.length} of ${message.data.size} rows`;
        case Message.RowData:
            return `${message.rowData.data.length} of ${message.rowData.size} rows`;
        default:
            return '';
    }
}
