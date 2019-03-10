'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

require('crypto');
var http = _interopDefault(require('http'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var url = _interopDefault(require('url'));

/* global require:false */

const services = {};
const serviceAPI = {};

function configure(config){

    console.log(`requestHandler.configure ${JSON.stringify(config,null,2)}`);

    config.services.forEach(async ({name, module, API}) => {
        console.log(`about to import ${module}`);
        services[name] = await Promise.resolve(require(module));
        API.forEach(messageType => serviceAPI[messageType] = name);
        console.log(`configure service ${name} `);
        services[name].configure(config);
    });

}

function findHandler(type){
    const serviceName = serviceAPI[type];
    if (serviceName){
        return services[serviceName][type];
    }
}

function killSubscriptions(clientId, queue){
    Object.keys(services).forEach(name => {
        const killSubscription = services[name]['unsubscribeAll'];
        if (killSubscription){
            killSubscription(clientId, queue);
        }
    });

}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector(compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

function ascendingComparator(f) {
  return function(d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);

function resetRange({lo,hi,bufferSize=0}){
    return {
        lo: 0,
        hi: hi-lo,
        bufferSize
    };
}

function getFullRange({lo,hi,bufferSize=0}){
    return {
        lo: Math.max(0, lo - bufferSize),
        hi: hi + bufferSize
    };
}

/*global fetch */

/*
    Inserts (and size records) and updates must be batched separately. Because updates are 
    keyed by index position and index positions may be affected by an insert operation, the
    timeline must be preserved. Updates can be coalesced until an insert is received. Then
    the update batch must be closed, to be followed by the insert(s). Similarly, multiple
    inserts, with no interleaved updates, can be batched (with a single size record). The batch
    will be closed as soon as the next update is received. So we alternate between update and
    insert processing, with each transition athe preceeding batch is closed off.
    An append is a simple insert that has no re-indexing implications.  

*/

const rangeUtils = {
  getFullRange,
  resetRange
};

const EMPTY_ARRAY$1 = [];
const ROWSET = 'rowset';
const UPDATE = 'update';
const FILTER_DATA = 'filterData';
const INDEX_FIELD$1 = 0;

class MessageQueue {

    constructor() {
        this._queue = [];
    }

    get length() { return this._queue.length; }
    set length(val) { this._queue.length = val; }
    get queue() {
        const q = this._queue.slice();
        this._queue.length = 0;
        return q;
    }

    push(message) {
        console.log(`MessageQueue. push<${message.type}|${message.dataType || ''}> ${JSON.stringify(message.range || (message.data && message.data.range))}`);

        const { type, data } = message;
        if (type === UPDATE) {
            //onsole.log(`MessageQueue. UPDATE pushed ${JSON.stringify(message)}`);
            mergeAndPurgeUpdates(this._queue, message);
        } else if (type === ROWSET) {
            if (message.data.rows.length === 0 && message.size > 0) {
                return;
            }
            mergeAndPurgeRowset(this._queue, message);

        } else if (type === FILTER_DATA && data.type !== 'numericBins') {
            mergeAndPurgeFilterData(this._queue, message);
        }

        this._queue.push(message);

    }

    purgeViewport(viewport) {
        this._queue = this._queue.filter(batch => batch.viewport !== viewport);
    }

    extract(test) {
        if (this._queue.length === 0) {
            return EMPTY_ARRAY$1;
        } else {
            return extractMessages(this._queue, test);
        }
    }
}


// This purges redundant messages from the queue and merges their data into the new message. 
// AN unintended consequence of this might be that data slips down the queue, as the new 
// message is added at the back of the queue - INVESTIGATE.
function mergeAndPurgeFilterData(queue, message) {
    //onsole.log(`mergeAndPurgeFiltreData new message with range ${JSON.stringify(message.data.range)}`);
    const { viewport, data: filterData } = message;
    const { range, size } = filterData;
    const { lo, hi } = rangeUtils.getFullRange(range);

    for (var i = queue.length - 1; i >= 0; i--) {

        let { type, viewport: vp, data } = queue[i];

        if (vp === viewport && type === FILTER_DATA) {

            var { lo: lo1, hi: hi1 } = rangeUtils.getFullRange(queue[i].data.range);

            if ((lo1 === 0 && hi1 === 0 && lo === 0) ||
                (lo1 >= hi || hi1 < lo)) {
                message.data = {
                    ...message.data,
                    selectedIndices: data.selectedIndices
                };
            }
            else {
                var overlaps = data.rows.filter(
                    row => row[INDEX_FIELD$1] >= lo && row[INDEX_FIELD$1] < hi);

                // TODO selectedIndices    
                if (lo < lo1) {
                    message.data = {
                        ...message.data,
                        rows: filterData.rows.concat(overlaps)
                    };
                }
                else {
                    message.data = {
                        ...message.data,
                        rows: overlaps.concat(filterData.rows)
                    };
                }

            }
            queue.splice(i, 1);
        }
    }
}

// we need to know the current range in order to be able to merge rowsets which are still valid
function mergeAndPurgeRowset(queue, message) {

    const { viewport, data: { rows, size, range, offset=0 } } = message;
    const { lo, hi } = rangeUtils.getFullRange(range);
    const low = lo + offset;
    const high = hi + offset;

    if (rows.length === 0){
        console.log(`MESSAGE PUSHED TO MESAGEQ WITH NO ROWS`);
        return;
    }

    for (var i = queue.length - 1; i >= 0; i--) {

        let { type, viewport: vp, data } = queue[i];

        if (vp === viewport) {

            if (type === ROWSET) { // snapshot. filterData, searchData 

                var { range: { lo: lo1, hi: hi1 } } = queue[i].data;

                if (lo1 >= hi || hi1 < lo) ;
                else {
                    var overlaps = data.rows.filter(
                        row => row[INDEX_FIELD$1] >= low && row[INDEX_FIELD$1] < high);

                    if (lo < lo1) {
                        message.data.rows = rows.concat(overlaps);
                    }
                    else {
                        message.data.rows = overlaps.concat(rows);
                    }
                }
                queue.splice(i, 1);
            }
            else if (type === UPDATE) {
                // if we have updates for rows within the current rowset, discard them - the rowset
                // represents latest data.
                let validUpdates = queue[i].updates.filter(u => {
                    let idx = u[INDEX_FIELD$1];

                    if (typeof rows[INDEX_FIELD$1] === 'undefined') {
                        console.warn(`MessageQueue:about to error, these are the rows that have been passed `);
                        console.warn(`[${rows.map(r => r[INDEX_FIELD$1]).join(',')}]`);
                    }


                    let min = rows[0][INDEX_FIELD$1];
                    let max = rows[rows.length - 1][INDEX_FIELD$1];

                    return idx >= low && idx < high &&   	// within range 
                        idx < size &&  				// within dataset  
                        (idx < min || idx >= max); 		// NOT within new rowset 
                });

                if (validUpdates.length) {
                    queue[i].updates = validUpdates;
                }
                else {
                    //onsole.log(`MessageQueue:purging updates that are no longer applicable`);
                    queue.splice(i, 1);
                }
            }


        }
    }
}

// we need to know the current range in order to be able to merge rowsets which are still valid
function mergeAndPurgeUpdates(queue, message) {

    //onsole.log(`mergeAndPurge: update message ${JSON.stringify(message)}` );

    var { viewport, range: { lo, hi } } = message;

    //onsole.log(`mergeAndPurge: update message ${lo} - ${hi}   ${JSON.stringify(queue)}` );

    for (var i = queue.length - 1; i >= 0; i--) {

        if (queue[i].type === message.type && queue[i].viewport === viewport) {

            //onsole.log(`we have a match for an update ${i} of ${queue.length}   ${JSON.stringify(queue[i].updates)}`)

            var { lo: lo1, hi: hi1 } = queue[i].updates;
            //onsole.log(`merging rowset current range [${lo},${hi}] [${queue[i].rows.lo},${queue[i].rows.hi}]`);
            queue.splice(i, 1);
        }
    }
}

function extractMessages(queue, test) {
    var extract = [];

    for (var i = queue.length - 1; i >= 0; i--) {
        if (test(queue[i])) {
            extract.push(queue.splice(i, 1)[0]);
        }
    }

    extract.reverse();
    console.log(`extracted messages ${JSON.stringify(extract.map(formatMessage))}\n\n`);
    return extract;
}

const formatMessage = msg => `type: ${msg.type} rows: [${msg.data && msg.data.rows.map(row => row[0])}]`;

function updateLoop(name, connection, interval, fn){
  
      //console.log(`starting update loop ${name} @  ${interval}`);
  
      let _keepGoing = true;
      let _timeoutHandle = null;
  
      function beat(){
  
          const message = fn();
  
          if (message !== null){
              connection.send(message);
          }	
          
          if (_keepGoing){
              _timeoutHandle = setTimeout(beat, interval);
          }
      }
  
      beat();
  
      function stopper(){
          console.log(`stopping updateLoop ${name}`);
          if (_timeoutHandle){
              clearTimeout(_timeoutHandle);
          }
          _keepGoing = false;
      }
  
      return stopper;
  
  
  }

// we can have a separate clientId for XHR requests
let _clientId = 0;

const requestHandler = (options, logger) => (localWebsocketConnection) => {

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
        const handler = findHandler(msgType);

        if (handler) {
            console.log(`JSON.stringify(message,null,2)`);
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

/* global require:false __dirname:false process:false module:false */

const WebSocket = require('ws');

const logger = console;

class SubscriptionCounter {
    constructor(){
        this._count = 0;
    }
    next(){
        this._count += 1;
        return this._count;
    }
}

//const mapArgs = (map, arg) => {let [n,v]=arg.split('=');map[n.toLowerCase()]=v;return map;};
// const args = process.argv.slice(2).reduce(mapArgs,{});
const port = /* argv.port || */ 9090;

//onsole.log(`args ${JSON.stringify(process.argv)}`);

//const port = process.env.OPENSHIFT_NODEJS_PORT || argv.port || 9090;
const PRIORITY_UPDATE_FREQUENCY = 50;
const CLIENT_UPDATE_FREQUENCY = 250;
const HEARTBEAT_FREQUENCY = 5000;

function start(config){

    configure({
        ...config,
        subscriptionCounter: new SubscriptionCounter()
    });

    const msgConfig = {
        CLIENT_UPDATE_FREQUENCY,
        HEARTBEAT_FREQUENCY,
        PRIORITY_UPDATE_FREQUENCY
    };

    const httpServer = http.createServer(function(request, response) {
        
        if (request.url === '/xhr'){
            handleXhrRequest(request, response);
        } else if (request.url.match(/\/ws\/stomp\/info/)) {
            // doesn't belng here
            const HTTP_HEADERS = {
                'Access-Control-Allow-Credentials': true,
                'Access-Control-Allow-Origin': request.headers['origin'],
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                // 'Content-Length':77,
                'Content-type': 'application/json;charset=UTF-8'
            };
            response.writeHead(200, HTTP_HEADERS);
            response.end(JSON.stringify({entropy: 9006110,origins: ['*:*'],'cookie_needed': true,websocket: true}));

        } else {
            console.log((new Date()) + ' received request for ' + request.url);
            request.addListener('end', function () {
                // do nothing
            }).resume();
        }
    });

    const wss = new WebSocket.Server({server: httpServer});

    // const requestHandler = argv.stomp   
    //     ? stompRequestHandler
    //     : argv.sockjs
    //         ? sockjsRequestHandler
    //         : viewserverRequestHandler;
    const requestHandler$$1 = requestHandler;

    wss.on('connection', requestHandler$$1(msgConfig, logger));

    // const ipaddress = '127.0.0.1';
    httpServer.listen(port, function() {
        console.log(`HTTP Server is listening on port ${port}`);
    });
}
function handleXhrRequest(request, response){
    let content = '';
    request.on('data', data => content += data);
    request.on('end', () => {
        console.log(`got a client request ${content}`);
        let {clientId,message} = JSON.parse(content);
    });
}

/* global __dirname:false */

//const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const __dirname = fs.realpathSync(process.cwd());

const config = {
    name: 'Instruments',
    dataPath: `${__dirname}/dataset`,
    createPath: `${__dirname}/create-row`,
    updatePath: `${__dirname}/update-row`,
    type: 'vs',
    primaryKey: 'Symbol',
    columns: [
        {name: 'Symbol'},
        {name: 'Name'},
        {name: 'Price', 'type': {name: 'price'}, 'aggregate': 'avg'},
        {name: 'MarketCap', 'type': {name: 'number','format': 'currency'}, 'aggregate': 'sum'},
        {name: 'IPO', 'type': 'year'},
        {name: 'Sector'},
        {name: 'Industry'}
    ],
    updates: {
        interval: 1000,
        fields: ['Price'],
        applyInserts: false,
        applyUpdates: false
    }
};

/* global __dirname:false */

// const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const __dirname$1 = fs.realpathSync(process.cwd());
//const resolveApp = relativePath => path.resolve(appDirectory, relativePath);


const config$1 = {
    name: 'InstrumentPrices',
    dataPath: `${__dirname$1}/data-generator`,
    // createPath: `${__dirname}/create-row.js`,
    // updatePath: `${__dirname}/update-row`,
    type: 'vs',
    primaryKey: 'ric',
    columns: [
        {name: 'ric'},
        {name: 'description'},
        {name: 'currency'},
        {name: 'exchange'},
        {name: 'lotsize'}
    ],
    updates: {
        applyInserts: false,
        applyUpdates: false
    }
};

/* global __dirname:false */

// const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const __dirname$2 = fs.realpathSync(process.cwd());

const config$2 = {
    name: 'TestTable',
    dataPath: `${__dirname$2}/data-generator`,
    createPath: `${__dirname$2}/create-row.mjs`,
    updatePath: `${__dirname$2}/update-row`,
    type: 'vs',
    primaryKey: 'Column-1',
    columns: [
        { name: 'Column-1', 'type': 'string' },
        { name: 'Column-2', 'type': 'string' },
        { name: 'Column-3', 'type': 'number' },
        { name: 'Column-4', 'type': 'number' },
        { name: 'Column-5', 'type': 'number' },
        { name: 'Column-6', 'type': 'string' },
        { name: 'Column-7', 'type': 'string', 'value': 'group1' },
        { name: 'Column-8', 'type': 'number' },
        { name: 'Column-9', 'type': 'number' },
        { name: 'Column-10', 'type': 'number' },
        { name: 'Column-11', 'type': 'number' },
        { name: 'Timestamp', 'type': 'datetime' },
        { name: 'AutoInc', 'type': 'increment' }
    ],
    updates: {
        interval: 30000,
        applyInserts: true,
        applyUpdates: false

    }
};

// import path from 'path';
//const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const __dirname$3 = fs.realpathSync(process.cwd());

const config$3 = {
    'name': 'CreditMatrix',
    'dataPath': `${__dirname$3}/data-generator`,
    'type': 'vs',
    'primaryKey': 'id',
    'columns': [
        { 'name': 'id' },
        { 'name': 'organisation' },
        { 'name': 'accountId' },
        { 'name': 'accountName' },
        { 'name': 'cptyOrganisation' },
        { 'name': 'cptyAccountId' },
        { 'name': 'cptyAccountName' },
        { 'name': 'ccy' },
        { 'name': 'maxQuantity' },
        { 'name': 'maxTenor' },
        { 'name': 'usedQuantity' },
        { 'name': 'availableQuantity' },
        { 'name': 'cptyMaxQuantity' },
        { 'name': 'cptyMaxTenor' },
        { 'name': 'cptyUsedQuantity' },
        { 'name': 'cptyAvailableQuantity' },
        { 'name': 'status' }
    ],
    'updates': false
};

/* global __dirname:false */

const __dirname$4 = path.dirname(new url.URL(new (typeof URL !== 'undefined' ? URL : require('ur'+'l').URL)((process.browser ? '' : 'file:') + __filename, process.browser && document.baseURI).href).pathname);

const ServiceDefinition = {
    name: 'DataTableService',
    module: `${__dirname$4}/DataTableService`,
    API: [
        'GetTableList',
        'GetTableMeta',
        'AddSubscription',
        'TerminateSubscription',
        'setViewRange',
        'GetFilterData',
        'GetSearchData',
        'ModifySubscription',
        'InsertTableRow',
        'groupBy',
        'sort',
        'filter',
        'select',
        'setGroupState',
        'ExpandGroup',
        'CollapseGroup',
        'unsubscribeAll'
    ]
};

const config$4 = {
    services: [
        ServiceDefinition
    ],
    DataTables: [
        config,
        config$1,
        config$2,
        config$3
    ]
};

console.log('server.mjs about to START SERVER');

start(config$4);
