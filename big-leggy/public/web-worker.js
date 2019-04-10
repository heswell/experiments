const MAX_LISTENERS = 10;

class EventEmitter {

    constructor() {
        this._events = {};
        this._maxListeners = MAX_LISTENERS;
    }

    addListener(type, listener) {
        let m;

        if (!isFunction(listener)) {
            throw TypeError('listener must be a function');
        }

        if (!this._events) {
            this._events = {};
        }

        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (this._events.newListener) {
            this.emit('newListener', type, listener);
        }

        if (!this._events[type]) {
            // Optimize the case of one listener. Don't need the extra array object.
            this._events[type] = listener;
        } else if (Array.isArray(this._events[type])) {
            // If we've already got an array, just append.
            this._events[type].push(listener);
        } else {
            // Adding the second element, need to change to array.
            this._events[type] = [this._events[type], listener];
        }

        // Check for listener leak
        if (Array.isArray(this._events[type]) && !this._events[type].warned) {
            if (!isUndefined(this._maxListeners)) {
                m = this._maxListeners;
            } else {
                m = MAX_LISTENERS;
            }

            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
                console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                this._events[type].length);
            }
        }

        return this;

    }

    removeListener(type, listener) {
        let list, position, length, i;

        if (!isFunction(listener)) {
            throw TypeError('listener must be a function');
        }

        if (!this._events || !this._events[type]) {
            return this;
        }

        list = this._events[type];
        length = list.length;
        position = -1;

        if (list === listener ||
            (isFunction(list.listener) && list.listener === listener)) {
            delete this._events[type];
            if (this._events.removeListener) {
                this.emit('removeListener', type, listener);
            }

        } else if (Array.isArray(list)) {
            for (i = length; i-- > 0;) {
                if (list[i] === listener ||
                    (list[i].listener && list[i].listener === listener)) {
                    position = i;
                    break;
                }
            }

            if (position < 0) {
                return this;
            }

            if (list.length === 1) {
                list.length = 0;
                delete this._events[type];
            } else {
                list.splice(position, 1);
            }

            if (this._events.removeListener) {
                this.emit('removeListener', type, listener);
            }
        }

        return this;

    }

    removeAllListeners(type) {

        if (!this._events) {
            return this;
        }

        const listeners = this._events[type];

        if (isFunction(listeners)) {
            this.removeListener(type, listeners);
        } else if (listeners) {
            // LIFO order
            while (listeners.length) {
                this.removeListener(type, listeners[listeners.length - 1]);
            }
        }
        delete this._events[type];

        return this;

    }

    emit(type, ...args) {

        if (!this._events) {
            this._events = {};
        }

        // If there is no 'error' event listener then throw.
        if (type === 'error') {
            if (!this._events.error ||
                (isObject(this._events.error) && !this._events.error.length)) {
                const err = arguments[1];
                if (err instanceof Error) {
                    throw err; // Unhandled 'error' event
                } else {
                    // At least give some kind of context to the user
                    throw new Error('Uncaught, unspecified "error" event. (' + err + ')');
                }
            }
        }

        const handler = this._events[type];

        if (isUndefined(handler)) {
            return false;
        }

        if (isFunction(handler)) {
            switch (args.length) {
            // fast cases
            case 0:
                handler.call(this);
                break;
            case 1:
                handler.call(this, type, args[0]);
                break;
            case 2:
                handler.call(this, type, args[0], args[1]);
                break;
            // slower
            default:
                handler.call(this, type, ...args);
            }
        } else if (Array.isArray(handler)) {
            handler.slice().forEach(listener => listener.call(this, type, ...args));
        }

        return true;

    }

    once(type, listener) {

        const handler = (evtName, message) => {
            this.removeListener(evtName, handler);
            listener(evtName, message);
        };

        this.on(type, handler);

    }

    on(type, listener) {
        return this.addListener(type, listener);
    }

}

function isFunction(arg) {
    return typeof arg === 'function';
}

function isObject(arg) {
    return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
    return arg === void 0;
}

const transportModule = "/websocket.js";

let connection;
let _requestSeq = 0;

class Connection extends EventEmitter {

    static connect(connectionString, userid=null, password=null) {

        return connection || (connection = new Promise(
            function (resolve, reject) {
                import(/* webpackIgnore: true */ transportModule)
                    .then(module => module.connect(connectionString))
                    .then(transport => new Connection(transport))
                    .then(resolve);
            }
        ));
    }

    constructor(transport) {

        super();

        this.transport = transport;

        transport.on('message', (evtName, message) => {
            if (Array.isArray(message)) {
                message.forEach(message => this.publishMessage(message));
            } else {
                this.publishMessage(message);
            }

        });
    }

    publishMessage(message){
        this.emit('message', message);
    }

    // send message to server
    send(message){
        this.transport.send(message);
    }

    // we could also allow server to provide it
    nextRequestId() {
        _requestSeq += 1;
        return 'REQ' + _requestSeq;
    }

}

function indexOf(arr, test){
    for (let i=0;i<arr.length;i++){
        if (test(arr[i])){
            return i;
        }
    }
    return -1;
}

function replace(arr,idx, value){
    const result = arr.slice();
    result[idx] = value;
    return result;
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

const SET_FILTER_DATA_COLUMNS = [
    {name: 'value'}, 
    {name: 'count'}, 
    {name: 'totalCount'}
];

const BIN_FILTER_DATA_COLUMNS = [
    {name: 'bin'}, 
    {name: 'count'}, 
    {name: 'bin-lo'},
    {name: 'bin-hi'}
];

const setFilterColumnMeta = metaData(SET_FILTER_DATA_COLUMNS);
const binFilterColumnMeta = metaData(BIN_FILTER_DATA_COLUMNS);

//TODO cache result by length
function metaData(columns){
    const start = Math.max(...columns.map((column, idx) => typeof column.key === 'number' ? column.key : idx));
    return {
        IDX: start + 1,
        DEPTH: start + 2,
        COUNT: start + 3,
        KEY: start + 4,
        SELECTED: start + 5,
        PARENT_IDX: start + 6,
        IDX_POINTER: start + 7,
        FILTER_COUNT: start + 8,
        NEXT_FILTER_IDX: start + 9,
        count: start + 10
    }
}

const DataTypes = {
    ROW_DATA: 'rowData',
    FILTER_DATA: 'filterData',
    FILTER_BINS: 'filterBins'
};

const NULL_RANGE = {lo: 0,hi: 0};

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

/**
 * Keep all except for groupRowset in this file to avoid circular reference warnings
 */

// Note, these must be exported in this order and must be consumed from this file.

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

const DataTypes$1 = DataTypes;

const {NULL_RANGE: NULL_RANGE$2} = rangeUtils;

//TODO can this be merged with DataRange
class DataRange {
    constructor(range = NULL_RANGE$2, size = 0, offset = 0, data = []) {
        this.range = range;
        this._size = size;
        this.offset = offset;
        this.data = data;
        this.selected = null;
        this.pendingRange = null;
    }
    get size(){
        return this._size;
    }
    set size(val) {
        if (typeof val !== 'number') {
            console.error(`DataRange.size invalid value ${val}`);
        } else {
            if (this.data.length > val) {
                this.data.length = val;
            }
            this._size = val;
        }
    }
    clear() {
        this._size = 0;
        this.data.length = 0;
        this.range = rangeUtils.resetRange(this.range);
    }
}

class Subscription {

    // TODO need to allow for large bufferSize, so we can load entire dataset
    constructor({ columns, range, size = 0, offset = 0 }) {
        this.columns = columns;
        this.meta = metaData(columns);
        this.bufferSize = 100;
        this._data = new DataRange(range, size, offset);
        this._filterData = new DataRange();
    }

    get offset() { return this._data.offset; }
    get size() { return this._data.size; }
    set size(val) { this._data.size = val; }

    reset(dataType, range = NULL_RANGE$2) {
        console.log(`reset ${dataType} ${JSON.stringify(range)}`);
        const [targetData] = this.getData(dataType);
        targetData.data = [];
        targetData.size = 0;
        targetData.range = range;
    }

    putSnapshot({ size, offset, rows, range: rangeFromServer }) {
        const { range } = this._data;
        this._data = new DataRange(range, size, offset, rows);
        const results = this._data.data.slice(range.lo, range.hi);
        console.log(`[Subscription.putSnapshot] range: ${range.lo} - ${range.hi} in: ${rows.length} rows, out: ${results.length} rows`);
        return results;
    }

    clear() {
        this._data.clear();
    }
    // realign the (buffered) data set to the new range.
    // return any rows that we already have in the buffer and that now come into range.
    putRange({ lo, hi }, dataType = DataTypes$1.ROW_DATA) {
        console.log(`[Subscription.putRange] range=${lo} - ${hi}`);
        const [targetData, meta] = this.getData(dataType);
        const [out, rowsInRange] = this._putRange(targetData, lo, hi, meta);
        targetData.range = { lo, hi };
        targetData.data = out;
        return rowsInRange;
    }

    // this never changes the range, rows within data are already aligned to (buffered) range
    // we need to be passed in the INDEX_OFFSET so we can detect change
    putRows(rows, offset = 0) {

        const [targetData, meta] = this.getData();
        const results = this._putRows(targetData, rows, meta, offset);

        if (offset !== targetData.offset) {
            targetData.offset = offset;
        }

        console.log(`[Subscription.putRows] in: ${rows.length} rows, out: ${results.rowset.length} rows`);
        return results;
    }

    putData(dataType, { type, rows: data, size }) {
        //onsole.groupCollapsed(`Subscription.putData<${dataType}> [${data.length ? data[0][0]: null} - ${data.length ? data[data.length-1][0]: null}]`);
        if (type === DataTypes$1.FILTER_BINS){
            return {rowset: data};
        } else {
            const [targetData, meta] = this.getData(dataType);
            targetData.size = size;
            const results = this._putRows(targetData, data, meta);
            return results;
        }
    }

    get rowData() { return this._data; }
    get filterData() { return this._filterData; }
    get filterSize() { return this._filterData.size; }
    set filterSize(val) { this._filterData.size = val; }

    getData(dataType = DataTypes$1.ROW_DATA) {
        return dataType === DataTypes$1.ROW_DATA ? [this._data, this.meta] :
            dataType === DataTypes$1.FILTER_DATA ? [this._filterData, setFilterColumnMeta] :
                [null];
    }

    _putRange(targetData, lo, hi, meta) {
        const { data, range, offset } = targetData;
        const {IDX} = meta;

        const low = lo + offset;
        const high = hi + offset;
        const bufferLow = Math.max(offset, low - this.bufferSize);
        const bufferHigh = high + this.bufferSize;
        const prevLow = range.lo + offset;
        const prevHigh = range.hi + offset;
        const len = data.length;
        const out = [];
        const rowsInRange = [];
        let requiredLow;
        let requiredHigh;
        let row;
        let firstRowIdx = -1;
        let i = 0;

        if (low >= prevHigh || high <= prevLow) {
            requiredLow = low;
            requiredHigh = high;
        } else if (high > prevHigh) {
            requiredLow = prevHigh;
            requiredHigh = high;
        } else {
            requiredLow = low;
            requiredHigh = prevLow;
        }

        while (row === undefined && firstRowIdx < len) {
            firstRowIdx += 1;
            row = data[firstRowIdx];
        }

        for (i = firstRowIdx; i < len; i++) {
            row = data[i];
            // Don't discard any rows if we haven't sent the range to the server.
            // if row is undefined, we have a gap in our data. THis happens when scrolling backwards
            // we have discarded some data when we were going forwards, but the server doesn't know
            // that, so hasn't sent us enough data 
            if (row) {
                let idx = row[IDX];

                if (idx >= bufferHigh) {
                    break;
                } else if (idx >= bufferLow && idx < bufferHigh) { // ok as long as we're scrolling forwards
                    out[idx - bufferLow] = row;

                    if (idx >= requiredLow && idx < requiredHigh) {
                        rowsInRange.push(row);
                    }
                }
            }
        }

        return [out, rowsInRange];

    }

    _putRows(targetData, rows, meta, newOffset = 0) {
        const { data, range, offset } = targetData;
        const {IDX} = meta;
        const { lo, hi } = range;
        const low = lo + offset;
        const high = hi + offset;
        const bufferLow = Math.max(offset, low - this.bufferSize);
        const bufferHigh = high + this.bufferSize;
        const rowset = [];
        const updates = [];

        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];
            let idx = row[IDX];

            if (lo === 0 && idx < offset) {
                //onsole.log(`Subscription.putRows we are at the top and this.is an insert at the top`);
                data.unshift(row); // unsafe  - temp hack only
                rowset.push(row);
                if (newOffset === offset) {
                    console.warn(`Subscription.putRows would expect a lowered offset in this scenario`);
                }
            } else if (idx >= bufferLow && idx < bufferHigh) {
                let rowIdx = idx - bufferLow;
                data[rowIdx] = row;
                if (idx >= low && idx < high) {
                    rowset.push(row);
                }
            }
        }

        return { rowset, updates };

    }

    putUpdates(updates) {

        const { lo, hi } = this._data.range;
        const low = lo + this.offset;
        const high = hi + this.offset;
        const bufferLow = Math.max(this.offset, low - this.bufferSize);
        const bufferHigh = high + this.bufferSize;
        const updatesInRange = [];

        //onsole.log(`%cSubscription.putUpdates ${updates.length} updates range = lo:${lo} hi: ${hi}`,'color:green;font-eright:bold');

        for (let i = 0; i < updates.length; i++) {
            let update = updates[i];
            let idx = update[0];

            if (idx >= bufferLow && idx < bufferHigh) {
                let row = this._data.data[idx - bufferLow];

                if (row === undefined) {
                    console.log(`%cSubscription.putUpdates update submitted for row that is absent from buffer idx:${idx}
                        range [${lo} - ${hi}] ==> [${low} - ${high}]
                        buffer [${bufferLow} ${bufferHigh}]
                        `, `color:red;font-weight:bold`);
                } else {
                    // keep the rows immutable, these row instances end up going to the client
                    row = row.slice();
                    // apply updates
                    //onsole.log(`client.Subscription receive updates ${JSON.stringify(update)}`);
                    for (let ii = 1; ii < update.length; ii += 2) {
                        // should we double check that the value has actually changed ?
                        row[update[ii]] = update[ii + 1];
                    }

                    if (idx >= low && idx < high) {
                        updatesInRange.push(update);
                    }
                    this._data.data[idx - bufferLow] = row;
                }

            }
        }

        //onsole.log(`%c    ... ${updates.length} updates ${updatesInRange.length} in range `,'color:green;font-eright:bold');
        return { updates: updatesInRange };

    }

    // Replace the group row with toggled group state and return it immediately to the client.
    // We have the opportunity for more caching opportunities here - caching the 
    // child contents of grouped data.
    toggleGroupNode(groupKey) {
        const { KEY, DEPTH } = this.meta;
        const idx = indexOf(this._data.data, row => row[KEY] === groupKey);
        const groupRow = this._data.data[idx];
        return this._data.data[idx] = replace(groupRow, DEPTH, -groupRow[DEPTH]);
    }
}

const ServerApiMessageTypes = {
  addSubscription: 'AddSubscription',
  setColumns: 'setColumns'
};

const CONNECT = 'connect';
const COLUMN_LIST = 'ColumnList';
const DATA = 'data';
const FILTER_DATA = 'filterData';
const GROUP_BY = 'groupBy';
const TABLE_LIST = 'TableList';
const UNSUBSCRIBE = 'TerminateSubscription';
const MODIFY_SUBSCRIPTION = 'ModifySubscription';
const SUBSCRIBED = 'Subscribed';
const SET_VIEWPORT_RANGE = 'setViewRange';
const SORT = 'sort';
const FILTER = 'filter';
const SELECT = 'select';
const SET_GROUP_STATE = 'setGroupState';
const EXPAND_GROUP = 'ExpandGroup';
const COLLAPSE_GROUP = 'CollapseGroup';
const GET_FILTER_DATA = 'GetFilterData';
const SEARCH_DATA = 'searchData';
const SNAPSHOT = 'snapshot';

const RowData = 'rowData';

const serverModule = "/viewserver.js";
console.log(`[ServerProxy] serverModule = ${serverModule}`);
const PLAIN = 'color: black; font-weight: normal';
const BLUE = 'color: blue; font-weight: bold';
const BROWN = 'color: brown; font-weight: bold';
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

function partition$1(array, test, pass = [], fail = []) {

    for (let i = 0, len = array.length; i < len; i++) {
        (test(array[i], i) ? pass : fail).push(array[i]);
    }

    return [pass, fail];
}

class ServerProxy {

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
        };

    }

    toString(){
        return `ServerProxy: ${this.connectionStatus}`
    }

    handleMessageFromClient(message) {

        const { type, viewport } = message;
        const isReady = this.connectionStatus === 'ready';
        let subscription;
        print(message, MSG_FROM_CLIENT);

        switch (type) {

            case CONNECT:
                this.connect(message);
                break;

            case ServerApiMessageTypes.addSubscription:
                this.subscribe(message);
                break;

            case SET_VIEWPORT_RANGE:
                //TODO drop buffering if we are scrolling faster than buffer can keep up
                if (subscription = this.subscriptions[viewport]) {
                    const { bufferSize } = subscription;
                    const { range, dataType } = message;
                    const { size, offset } = subscription[dataType];
                    this.sendMessageToServer({
                        type: SET_VIEWPORT_RANGE,
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
                    console.log(`%c setViewRange, no subscription`,'background-color: brown;color: cyan');
                    this.queuedRequests.push(message);
                }

                break;

            case EXPAND_GROUP:
            case COLLAPSE_GROUP:

                this.sendIfReady(message, this.connectionStatus === 'ready');

                if (subscription = this.subscriptions[viewport]) {
                    const groupRow = subscription.toggleGroupNode(message.groupKey);
                    const {IDX, DEPTH} = subscription.meta;
                    const updates = [[groupRow[IDX], DEPTH, groupRow[DEPTH]]];
                    this.postMessage({ data: { type: 'update', viewport, updates } });
                }

                break;

            case UNSUBSCRIBE:

                this.sendIfReady(message, isReady);
                delete this.subscriptions[viewport];

                break;

            case GROUP_BY:
                if (subscription = this.subscriptions[viewport]) {
                    subscription.clear();
                }
            case SET_GROUP_STATE:
            case TABLE_LIST:
            case COLUMN_LIST:
            case SORT:
            case FILTER:
            case SELECT:
                this.sendIfReady(message, isReady);

                break;

            case GET_FILTER_DATA:
                //TODO expand range, so we prepopulate subscription cache
                // console.log(`%c>>>${new Date().toISOString().slice(11,23)} handleMesageFromClient '${Message.GET_FILTER_DATA}' `, 'color:green;font-weight:bold');
                this.sendIfReady(message, isReady);
                if (subscription = this.subscriptions[viewport]) {
                    subscription.reset(DataTypes.FILTER_DATA, message.range);
                }
                break;

            case MODIFY_SUBSCRIPTION:

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

        console.log(`[ServerProxy.connect] connectionString: ${connectionString} connectionId: ${connectionId}`);
        this.connectionStatus = 'connecting';

        const module = asyncServerModule ||
            (asyncServerModule = import(/* webpackIgnore: true */ serverModule)
                .catch(err => console.log(`failed to load server ${err}`)));

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
            const byTypeAndViewport = msg => msg.viewport === viewport && msg.type === SET_VIEWPORT_RANGE;
            const [rangeMessages] = partition$1(this.queuedRequests, byTypeAndViewport);

            const { range = NULL_RANGE } = message;
            this.pendingSubscriptionRequests[viewport] = message;
            console.log(`%c SUBSCRIBE to ${viewport} 
                with range ${range.lo} = ${range.hi} stored
                        range ${range.lo} = ${range.hi === 0 ? 10 : range.hi} sent to server
                        we have ${rangeMessages.length} range messages

                ${JSON.stringify(this.queuedRequests,null,2)}`,'background-color: brown;color: cyan');
                console.log(message);

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
            console.log(`%c[ServerProxy.handleMessageFromServer] SUBSCRIBED create subscription range ${range.lo} - ${range.hi}`,'background-color: yellow');
            const subscription = this.subscriptions[viewport] = new Subscription({
                columns,
                range,
                size,
                offset,
            });

            this.pendingSubscriptionRequests[viewport] = undefined;

            const byViewport = vp => item => item.viewport === vp;
            const byMessageType = msg => msg.type === SET_VIEWPORT_RANGE;
            const [messagesForThisViewport, messagesForOtherViewports] = partition$1(this.queuedRequests, byViewport(viewport));
            const [rangeMessages, otherMessages] = partition$1(messagesForThisViewport, byMessageType);

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
                type: SET_VIEWPORT_RANGE,
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
        console.log(`%c onReady ${JSON.stringify(this.queuedRequests)}`,'background-color: brown;color: cyan');

        const byReadyToSendStatus = msg => msg.viewport === undefined || msg.type === ServerApiMessageTypes.addSubscription;
        const [readyToSend, remainingMessages] = partition$1(this.queuedRequests, byReadyToSendStatus);
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

            case DATA:

                this.processData(message.data);

                break;

            case SNAPSHOT:
                if (subscription = this.subscriptions[viewport]) {
                    const { data } = message;
                    const rows = subscription.putSnapshot(data);
                    if (rows.length) {
                        this.postMessage({ data: { type: DataTypes.ROW_DATA, viewport, rowData: { ...data, data: rows } } });
                    }
                }
                break;

            case SUBSCRIBED:
                this.subscribed(message);
                break;

            case FILTER_DATA:
            case SEARCH_DATA:
                if (subscription = this.subscriptions[viewport]) {
                    const { filterData } = message;

                    const { rowset: data } = subscription.putData(type, filterData);

                    if (data.length || filterData.size === 0) {
                        this.postMessage({
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

function print(message, direction, method=null){
    const color = direction === MSG_FROM_SERVER || direction === MSG_TO_CLIENT ? BLUE : BROWN;
    console.log(`%c[ServerProxy${method === null ? '' : '.' + method}] %c${direction}  ${message.type} %c${messageToString(message, direction)}`, PLAIN, color, PLAIN, color, PLAIN);
}

function messageToString(message, direction){
    const {requestId='', viewport=''} = message;
    switch (message.type){
        case SET_VIEWPORT_RANGE:
            return `${requestId} range: %c${message.range.lo} - ${message.range.hi} %cvp ${viewport}`;
        case ServerApiMessageTypes.addSubscription:
        case SUBSCRIBED:
            return `${requestId} vp:${message.viewport}`;
        case 'rowset':
        case SNAPSHOT:
            return `${message.data.rows.length} of ${message.data.size} rows`;
        case RowData:
            return `${message.rowData.data.length} of ${message.rowData.size} rows`;
        case FILTER_DATA:
            if (message.data){
                console.table(message.data.rows);
            }
            return `${(message.data || message.filterData).rows.length} of %c${(message.data || message.filterData).size} rows`;
        default:
            return '';
    }
}

class WebWorker {

    //TODO allow connectionString to be passed in constructor
    constructor() {
        console.log(`WebWorker.constructor`);
        this._server = new ServerProxy(message => this._onmessage(message));
    }

    postMessage(message){
        this._server.handleMessageFromClient(message);
    }

    _onmessage(message){
        console.log(`message received from worker, no client is listening ${JSON.stringify(message)}`);
    }

    set onmessage(handler) {
        this._onmessage = handler;
    }

    terminate(){
        console.log(`terminate worker`);
    }

}

console.log(`>>>> The webworker script has loded`);

export default WebWorker;
//# sourceMappingURL=web-worker.js.map
