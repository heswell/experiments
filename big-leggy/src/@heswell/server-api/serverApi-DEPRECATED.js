
import Worker from './webWorker.mjs';
import {SUBSCRIBE, UNSUBSCRIBE} from './messages.mjs';
import {EventEmitter} from '@heswell/utils';
import {DataTypes} from '@heswell/data';
const uuid = require('uuid');

let connectionId = 0;
let connectionPending = null;
let workerReady = false;

const _subscriptions = {};
const _pendingFetchRequests = {};
const _pendingSubscriptions = [];
const _pendingRequests = [];
const worker = new Worker();
worker.onmessage = messageFromTheWorker;

export const onConnectionStatusChange = new EventEmitter();

export function connect (connectionString){
    const msg = {type: 'connect', connectionId, connectionString};
    if (workerReady){
        worker.postMessage(msg);
    } else {
        connectionPending = msg;
    }
}

export function disconnect(viewport){
    console.warn(`disconnect viewport ${viewport}`);
}

export function fetch(requestType, params=null){

    return new Promise(function(resolve, reject){

        const requestId = uuid.v1();

        worker.postMessage({
            requestId,
            type: requestType,
            params
        });

        _pendingFetchRequests[requestId] = {resolve, reject};

    });
}

function Subscription(cancel){
    let _emit;
    return Object.create(null,{
        emit: {value: message => _emit(message)},
        on: {value: (fn => _emit = fn)},
        cancel: {value: () => cancel()}
    });
}

export function subscribe(message){
    //onsole.log(`%cserver-api.subscribe: ${JSON.stringify(message)}`,'color:blue;font-weight:bold;');

    const {viewport} = message;
    const msg = {type: SUBSCRIBE, ...message};

    if (connectionPending){
        _pendingSubscriptions.push(msg);
    } else {
        worker.postMessage(msg);
    }

    //TODO is this right if we have not sent the subscription message yet
    return _subscriptions[viewport] = Subscription(() => {
        worker.postMessage({type: UNSUBSCRIBE, viewport});
        delete _subscriptions[viewport];
    });
}

export function setViewRange(viewport, range, dataType=DataTypes.ROW_DATA){
    //onsole.log(`server-api.setViewRange<${dataType}> ${viewport} ${range.lo} - ${range.hi}`);
    const msg = {type: 'setViewRange', viewport, range, dataType};

    if (connectionPending){
        _pendingRequests.push(msg);
    } else {
        worker.postMessage(msg);
    }
}

export function groupBy(message){
    worker.postMessage({type: 'groupBy',	...message});
}

export function sort(message){
    worker.postMessage({type: 'sort', ...message});
}

export function filter(message){
    worker.postMessage({type: 'filter', ...message});
}

export function select(message){
    worker.postMessage({type: 'select', ...message});
}

export function setGroupState(message){
    worker.postMessage({type: 'setGroupState', ...message});
}

export function getFilterData(message){
    worker.postMessage({type: 'GetFilterData', ...message});
}

export function getSearchData(message){
    worker.postMessage({type: 'GetSearchData', ...message});
}

export function modifySubscription(message){
    worker.postMessage({type: 'ModifySubscription', ...message});
}

export function expandGroup(message){
    worker.postMessage({type: 'ExpandGroup', ...message});
}

export function collapseGroup(message){
    worker.postMessage({type: 'CollapseGroup', ...message});
}

function messageFromTheWorker(evt){
    const data = evt.data;
    let fetchRequest;

    switch (data.type){

    case 'identify' : return identifyMessage(data);

    case 'connection-status':

        connectionMessage(data);

        break;

    case 'subscribed':
        // no action required;
        break;

    case 'colset':
    case 'size':
    case 'update':
    case DataTypes.ROW_DATA:
    case DataTypes.FILTER_DATA:

        return relayMessage(data);

    case 'table-list':

        if (fetchRequest = _pendingFetchRequests[data.requestId]){
            fetchRequest.resolve(data.tables);
            _pendingFetchRequests[data.requestId] = null;
        }

        break;

    case 'column-list':

        if (fetchRequest = _pendingFetchRequests[data.requestId]){
            let {requestId, ...rest} = data;
            fetchRequest.resolve(rest);
            _pendingFetchRequests[requestId] = null;
        }

        break;

    default : console.error(`server-api.messageFromTheWorker unhandled message type ${JSON.stringify(data)}`);
    }

}

function identifyMessage(message){

    console.log(`[serverApi] identifyMessage ${message.identity}
        connectionPending ? ${!!connectionPending}
        ${_pendingSubscriptions.length} pending subscriptions
        ${_pendingRequests.length} pending requests

    `)
    workerReady = true;

    connectionId = message.identity;

    if (connectionPending){

        connectionPending.connectionId = connectionId;
        worker.postMessage(connectionPending);

        if (_pendingSubscriptions.length){
            //onsole.log(`   ...  and we have pending subscriptions`);
            _pendingSubscriptions.forEach(msg => worker.postMessage(msg));
            _pendingSubscriptions.length = 0;
        }

        if (_pendingRequests.length){
            //onsole.log(`  ... as well as pending connection, we have pending requests, push these to the worker now as well`);
            _pendingRequests.forEach(msg => worker.postMessage(msg));
            _pendingRequests.length = 0;
        }

        // we should avoid doing this until the connection is established
        connectionPending = null;

    }
}

function connectionMessage(message){
    onConnectionStatusChange.emit('connectionStatusChange', message);
}

function relayMessage(message){
    const subscription = _subscriptions[message.viewport];

    if (subscription){
        subscription.emit(message);
    } else {
        console.warn(`we have a msg for viewport ${message.viewport} which has no subscription, must have just unsubscribed`);
    }

}
