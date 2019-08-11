'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopNamespace(e) {
    if (e && e.__esModule) { return e; } else {
        var n = {};
        if (e) {
            Object.keys(e).forEach(function (k) {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            });
        }
        n['default'] = e;
        return n;
    }
}

var data = require('@heswell/data');

class Table extends data.Table {

    async loadData(dataPath){
        const {default: data} = await new Promise(function (resolve) { resolve(_interopNamespace(require(dataPath))); });
        if (data) {
            this.parseData(data);
        } 
    }

    async installDataGenerators({createPath, updatePath}){
        if (createPath){
            const {default:createGenerator} = await new Promise(function (resolve) { resolve(_interopNamespace(require(createPath))); });
            this.createRow = createGenerator;
        }
        if (updatePath){
            const {default: updateGenerator} = await new Promise(function (resolve) { resolve(_interopNamespace(require(updatePath))); });
            this.updateRow = updateGenerator;
        }
    }

}

//TODO implement as class
function Subscription (table, {viewport, requestId, ...options}, queue){

    const tablename = table.name;
    const {range, columns, sortCriteria, groupBy} = options;

    let view = new data.DataView(table, {columns, sortCriteria, groupBy});
    let timeoutHandle;

    const tableMeta = data.columnUtils.metaData(columns);

    console.log(`Subscription ${tablename} ${JSON.stringify(options,null,2)}`);

    queue.push({
        requestId,
        viewport,
        type: 'Subscribed',
        tablename,
        size: view.size,
        offset: view.offset
    });

    if (view.status === 'ready'){
        const data = view.setRange(range);
        if (data.rows.length){
            console.log(`initial set of data returned immediately on Subscription ${JSON.stringify(range)} (${data.rows.length} rows)`);
            queue.push({
                viewport: viewport,
                type: 'snapshot',
                data
            });
        }
    }

    function collectUpdates(){
        let {updates, range} = view.updates;
        // TODO will we ever get updates for FilterData ? If se we will need correct mats
        // depending on the batch type there will be one of 
        // updates, rows or size. The others will be 
        // undefined and therefore not survive json serialization.
        updates.forEach(batch => {
            const {type, updates, rows, size, offset} = batch;
            queue.push({
                priority: 2,
                viewport: viewport,
                type,
                tablename,
                updates,
                rows,
                size,
                offset,
                range
            }, tableMeta);
        });


        timeoutHandle = setTimeout(collectUpdates, 250);
    }

    timeoutHandle = setTimeout(collectUpdates, 1000);

    return Object.create(null,{

        invoke: {
            value: (method, queue, type, ...params) => {
                let data$1, filterData;

                if (method === 'filter'){
                    [data$1, ...filterData] = view[method](...params);
                } else {
                    data$1 = view[method](...params);
                }
                const meta = type === data.DataTypes.FILTER_DATA
                    ? data.columnUtils.setFilterColumnMeta
                    : tableMeta; 

                if (data$1){
                    queue.push({
                        priority: 1,
                        viewport,
                        type,
                        data: data$1
                    }, meta);
                }

                filterData && filterData.forEach(data$1 => {
                    queue.push({
                        priority: 1,
                        viewport,
                        type: data.DataTypes.FILTER_DATA,
                        data: data$1
                    }, data.columnUtils.setFilterColumnMeta);

                });
            }
        },

        // A client update request is handled with a synchronous call to view.rows
        update: {value: (options, queue) => {

            const {range, ...dataOptions} = options;
            
            queue.push({
                priority: 1,
                viewport: viewport, 
                type: 'rowset',
                tablename,
                data: {
                    rows: view.rows(range, options),
                    size: view.size,
                    offset: view.offset
                }
            });

        }},

        cancel: {value : () => {

            if (timeoutHandle){
                clearTimeout(timeoutHandle);
                timeoutHandle = null;
            }
            view.destroy();
            view = null;
        }}

    });

}

/* global __dirname:false */

const _tables = {};
var _subscriptions = {};
var _client_subscriptions = {};

// TODO unify these with DataTypes
const DataType = {
    Rowset: 'rowset',
    Snapshot: 'snapshot',
    FilterData: 'filterData',
    SearchData: 'searchData',
    Selected: 'selected'
};

// need an API call to expose tables so extension services can manipulate data

function configure({DataTables}){
    DataTables.forEach(config => {
        _tables[config.name] = new Table(config);
    });

}

function unsubscribeAll(clientId, queue){
    const subscriptions = _client_subscriptions[clientId];
    if (subscriptions && subscriptions.length){
        subscriptions.forEach(viewport => {
            const subscription = _subscriptions[viewport];
            subscription.cancel();
            delete _subscriptions[viewport];
            queue.purgeViewport(viewport);
        });
        delete _client_subscriptions[clientId];
    }
}

function AddSubscription(clientId, request, queue){

    const table = getTable(request.tablename);
    _subscriptions[request.viewport] = Subscription(table, request, queue);
    let clientSubscriptions = _client_subscriptions[clientId] || (_client_subscriptions[clientId] = []);
    clientSubscriptions.push(request.viewport);

}

function TerminateSubscription(clientId, request, queue){
    const {viewport} = request;
    _subscriptions[viewport].cancel();
    delete _subscriptions[viewport];
    // purge any messages for this viewport from the messageQueue
    _client_subscriptions[clientId] = _client_subscriptions[clientId].filter(vp => vp !== viewport);
    if (_client_subscriptions[clientId].length === 0){
        delete _client_subscriptions[clientId];
    }
    queue.purgeViewport(viewport);
}

// SuspendSubscription
// ResumeSUbscription
// TerminateAllSubscriptionsForClient

function ModifySubscription(clientId, request, queue){
    _subscriptions[request.viewport].update(request, queue);
}

function ExpandGroup(clientId, request, queue){
    _subscriptions[request.viewport].update(request, queue);
}

function CollapseGroup(clientId, request, queue){
    _subscriptions[request.viewport].update(request, queue);	
}

function GetTableList(clientId, request, queue){

    const {requestId} = request;

    queue.push({
        priority: 1,
        requestId,
        type: 'table-list',
        tables: getTableNames()
    });
}

function GetTableMeta(clientId, request, queue){

    const {requestId} = request;
    const table = getTable(request.table);

    queue.push({
        priority: 1,
        requestId,
        type: 'column-list',
        table: table.name,
        key: 'Symbol',
        columns: table.columns
    });
}

function setViewRange(clientId, request, queue){

    const {viewport, range, useDelta=true, dataType} = request;
    //TODO this can be standardised
    const type = dataType === 'rowData'
        ? DataType.Rowset
        : dataType === 'filterData'
            ? DataType.FilterData
            : dataType === 'searchData' ? DataType.SearchData : null;
        // should be purge the queue of any pending updates outside the requested range ?

    const now = new Date().getTime();
    console.log(' ');
    console.log(`[${now}] DataTableService: setRange ${range.lo} - ${range.hi}`);

    _subscriptions[viewport].invoke('setRange', queue, type, range, useDelta, dataType);

}

function sort(clientId, {viewport, sortCriteria}, queue){
    _subscriptions[viewport].invoke('sort', queue, DataType.Snapshot, sortCriteria);
}

function filter(clientId, {viewport, filter, incremental, dataType}, queue){
    _subscriptions[viewport].invoke('filter', queue, DataType.Rowset, filter, dataType, incremental);
}

function select(clientId, {viewport, idx, rangeSelect, keepExistingSelection}, queue){
    _subscriptions[viewport].invoke('select', queue, DataType.Selected, idx, rangeSelect, keepExistingSelection);
}

function groupBy(clientId, {viewport, groupBy}, queue){
    _subscriptions[viewport].invoke('groupBy', queue, DataType.Snapshot, groupBy);
}

function setGroupState(clientId, {viewport,groupState}, queue){
    _subscriptions[viewport].invoke('setGroupState', queue, DataType.Rowset, groupState);
}

function GetFilterData(clientId, {viewport, column, searchText, range}, queue){
    // TODO what about range ?
    _subscriptions[viewport].invoke('getFilterData', queue, DataType.FilterData, column, searchText, range);
}

function InsertTableRow(clientId, request, queue){
    const tableHelper = getTable(request.tablename);
    tableHelper.table.insert(request.row);
    console.warn(`InsertTableRow TODO send confirmation ${queue.length}`);
}

function getTable(name){
    if (_tables[name]){
        return _tables[name]
    } else {
        throw Error('DataTableService. no table definition for ' + name);
    }
}

function getTableNames(){
    return Object.keys(_tables);
}

exports.AddSubscription = AddSubscription;
exports.CollapseGroup = CollapseGroup;
exports.ExpandGroup = ExpandGroup;
exports.GetFilterData = GetFilterData;
exports.GetTableList = GetTableList;
exports.GetTableMeta = GetTableMeta;
exports.InsertTableRow = InsertTableRow;
exports.ModifySubscription = ModifySubscription;
exports.TerminateSubscription = TerminateSubscription;
exports.configure = configure;
exports.filter = filter;
exports.groupBy = groupBy;
exports.select = select;
exports.setGroupState = setGroupState;
exports.setViewRange = setViewRange;
exports.sort = sort;
exports.unsubscribeAll = unsubscribeAll;
