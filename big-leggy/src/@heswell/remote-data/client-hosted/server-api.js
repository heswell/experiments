import * as Message from '../messages.js';
import {ServerApiMessageTypes as API} from '../messages.js';
import ClientSubscription from './client-subscription';
import uuid from '../../server-core/uuid';
import {msgType as Msg, createLogger, logColor, connectionId as _connectionId} from '../constants';

import { postMessageToWorker, setWorkerCallback } from './worker';

const logger = createLogger('ServerApi', logColor.brown);

const clientId = uuid();

// first call to getWorker triggers the module load and sets the callback
setWorkerCallback(messageFromTheWorker)

const workerModule = process.env.WORKER_MODULE || '/web-worker.js';
logger.log(`[ServerApi] workerModule = ${workerModule}`)
// const asyncWorkerModule = import(/* webpackIgnore: true */ workerModule)
//     .catch(err => console.log(`failed to load worker ${err}`));


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

    // connections[connectionString] set to a promise. However will be replaced with
    // the actual connection once connected, That can't be right
    return connections[connectionString] || (
        connections[connectionString] = new Promise(async (resolve, reject) => {
            const connectionId = `connection-${_connectionId.nextValue}`;
            const timeoutHandle = setTimeout(() => {
                delete pendingPromises[connectionId];
                reject(new Error('timed out waiting for server response'));
            }, 5000);
            pendingPromises[connectionId] = {
                resolve,
                reject,
                connectionString,
                timeoutHandle,
                // do we want this to be true ONLY if this was the first request ?
                isDefaultConnection 
            };
            logger.log(JSON.stringify({type: Msg.connect, clientId, connectionId, connectionString}))
            postMessageToWorker({type: 'connect', clientId, connectionId, connectionString});
        })
    )
}

// we have to return a subscription synchronously
export function subscribe(message){
    console.log(`[serverApi2.subscribe] vp ${message.viewport}`)
    const viewport = message.viewport || `viewport-${_subscriptionId++}`;
    const subscription = subscriptions[viewport] = new ClientSubscription(null, viewport)

    // blocks here until connection is resolved (to an instance of ServerApi)
    getDefaultConnection().then(connection => {
        console.log(`serverApi, now we have a connection, we can subscribe`)
        connection.subscribe(message, viewport);
    });
    // clearTimeout(timeoutHandle);

    return subscription;
}

// returned to clients asynchronously when they subscribe
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
        console.log(`[ServerApi.subscribe]   ${API.addSubscription}  ===>  SW   vp: ${viewport} ${JSON.stringify(message,null,2)}`)
        postMessageToWorker({
            connectionId: this.connectionId,
            viewport,
            type: API.addSubscription,
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
            postMessageToWorker({
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

