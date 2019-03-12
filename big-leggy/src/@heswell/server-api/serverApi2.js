// import Worker from './webWorker.mjs';
import * as Message from './messages.js';
import { DataTypes } from '../data/store/types';
import uuid from '../server-core/uuid';
const clientId = uuid();

const workerModule = process.env.WORKER_MODULE || '/web-worker.js';
console.log(`[ServerApi] workerModule = ${workerModule}`)
const asyncWorkerModule = import(/* webpackIgnore: true */ workerModule)
    .catch(err => console.log(`failed to load worker ${err}`));

let worker;
let defaultConnection = {status: 'pending'};
let pendingConnection = new Promise((resolve, reject) => {
    defaultConnection.resolve = resolve;
    defaultConnection.reject = reject;
});

const getDefaultConnection = () => pendingConnection;

const connections = {};
const subscriptions = {};
const pendingPromises = {};
let _requestId = 1;
let _subscriptionId = 1;

async function getWorker(){
    return asyncWorkerModule.then(workerModule => {
        const Worker = workerModule.default;

        return worker || (worker = new Promise((resolve, reject) => {
            const w = new Worker();
            w.onmessage = ({data: message}) => {
                if (message.type === 'identify'){
                    w.onmessage = messageFromTheWorker;
                    resolve(w);
                } else {
                    reject(new Error('Worker failed to identify'));
                }
            };
        }))

    });
}

function postMessage(message){
    getWorker().then(worker => worker.postMessage(message));
}

// Multiple calls to this will be ok, but only one connection to each server will be possible
// more than one connection can be created if more than one url is specified. 
/**
 * 
 * @param connectionString 
 * @param isDefaultConnection
 * @returns ServerAPI 
 */
export function connect(
    connectionString,
    isDefaultConnection=true && defaultConnection.status === 'pending'
){
    if (isDefaultConnection){
        // is it possible that defaultConnection.status could be pending, yet we have already 
        // resolved this connection ?

        // if we're already connected on the default connection ...
        // 
        // else ...

        defaultConnection.status = 'connecting';
    }
    return connections[connectionString] || (
        connections[connectionString] = new Promise(async (resolve, reject) => {
            const connectionId = `connection-${_requestId++}`;
            const timeoutHandle = setTimeout(() => {
                delete pendingPromises[connectionId];
                reject(new Error('timed out waiting for server response'));
            }, 5000);
            pendingPromises[connectionId] = {
                resolve,
                reject,
                connectionString,
                timeoutHandle,
                isDefaultConnection
            };
            const worker = await getWorker();
            const msg = {type: 'connect', clientId, connectionId, connectionString};
            worker.postMessage(msg);
        })
    )
}

// we have to return a subscription synchronously
export function subscribe(message){
    console.log(`[serverApi2.subscribe] vp ${message.viewport}`)
    const viewport = message.viewport || `viewport-${_subscriptionId++}`;
    const subscription = subscriptions[viewport] = new ClientSubscription(null, viewport)

    // const timeoutHandle = setTimeout(() => {throw new Error(`Timed out`)}, 1000)
    getDefaultConnection().then(connection => {
        console.log(`serverApi, now we have a connection, we can subscribe`)
        connection.subscribe(message, viewport);
    });
    // clearTimeout(timeoutHandle);

    return subscription;
}

class ServerAPI {
    constructor(connectionId, isDefault){
        this.connectionId = connectionId;
        this.isDefault = isDefault;
    }

    disconnect(){
        console.log(`disconnect ${this.connectionId}`)
    }

    subscribe(message, viewport=`viewport-${_subscriptionId++}`){
        // From here, the serverProxy will maintain the association between connection
        // and viewport, we only have to supply viewport
        console.log(`[ServerApi.subscribe]   ${Message.SUBSCRIBE}  ===>  SW   vp: ${viewport}`)
        postMessage({
            connectionId: this.connectionId,
            viewport,
            type: Message.SUBSCRIBE,
            ...message
        })
        if (subscriptions[viewport]){
            subscriptions[viewport].connectionId = this.connectionId;
            return subscriptions[viewport];
        } else {
            return subscriptions[viewport] = new ClientSubscription(this.connectionId, viewport);
        }
    }

    query(requestType, params=null){
        return new Promise(function(resolve, reject){
            const correlationId = uuid.v1();
            postMessage({
                requestId: correlationId,
                type: requestType,
                params
            });
            const timeoutHandle = setTimeout(() => {
                delete pendingPromises[correlationId];
                reject(new Error('timed out waiting for server response'));
            }, 5000);
            pendingPromises[correlationId] = {resolve, reject, timeoutHandle};
        });
    }

    toString(){
        return `I'm a ServerAPI @ ${this.connectionId}`
    }

}

// if we have multiple connections open, this must identify the connection
function messageFromTheWorker({data: message}){
    switch (message.type){
        case Message.RowData:
        case 'update':
        case Message.FilterData:
        case 'filterBins':
        case Message.Size:
            console.log(`[ServerAPI2.messageFromTheWorker]   Subscription<${message.viewport}>.onData  <==   ${message.type}`)
            return subscriptions[message.viewport].onData(message);
        case Message.ConnectionStatus:
            console.log(`[ServerAPI2]  <==   ${message.type}`)
            return connectionMessage(message);
        case Message.TableList:
            console.log(`[ServerAPI2]  <==   ${message.type}`)
            return resolveQuery(message);
        default:
            console.log(`[ServerAPI] message received from worker ${message.type} #${message.viewport}`);
    }
}

function resolveQuery({type, requestId, ...results}){
    if (pendingPromises[requestId]){
        const {resolve, timeoutHandle} = pendingPromises[requestId];
        clearTimeout(timeoutHandle);
        delete pendingPromises[requestId];
        resolve(results);
    }

}

function connectionMessage(message){
    if (message.status === 'ready'){
        const {connectionId} = message;
        if (pendingPromises[connectionId]){
            // TODO handle reject here as well
            const {resolve, connectionString, timeoutHandle, isDefaultConnection} = pendingPromises[connectionId];
            clearTimeout(timeoutHandle);
            delete pendingPromises[connectionId];
            const connection = new ServerAPI(connectionId, isDefaultConnection);
            connections[connectionString] = connection;
            resolve(connection);
            if (isDefaultConnection && defaultConnection.status !== 'connected'){
                defaultConnection.status = 'connected';
                defaultConnection.resolve(connection);
            }
        }
    }
}

class ClientSubscription {
    constructor(connectionId, subscriptionId){
        this.connectionId = connectionId;
        this.id = subscriptionId;
    }

    _onData(message){
        console.log(`Subscription ${this.id} received ${message.type} but no client listening`);
    }

    set onData(callback){
        this._onData = callback;
    }

    get onData(){
        return this._onData;
    }

    setRange(lo, hi, dataType=DataTypes.ROW_DATA){
        postMessage({
            clientId,
            viewport: this.id,
            type: Message.SET_VIEWPORT_RANGE,
            range: {lo,hi},
            dataType
        })
    }

    groupBy(columns){
        postMessage({
            viewport: this.id,
            type: Message.GROUP_BY,
            groupBy: columns
        })
    }

    setGroupState(groupState){
        postMessage({
            viewport: this.id,
            type: Message.SET_GROUP_STATE,
            groupState
        })
    }

    sort(columns){
        postMessage({
            viewport: this.id,
            type: Message.SORT,
            sortCriteria: columns
        })
    }

    filter(filter){
        postMessage({
            viewport: this.id,
            type: Message.FILTER,
            filter
        })
    }

    getFilterData(column, searchText, range){
        postMessage({
            viewport: this.id,
            type: Message.GET_FILTER_DATA,
            column,
            searchText,
            range
        })
    }

    toString(){
        return `I'm a subscription  #${this.id} on #${this.connectionId}`;
    }
}
