/* global __dirname:false */
import Table from './Table';
import Subscription from './Subscription';

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

export function configure({DataTables}){
    DataTables.forEach(config => {
        _tables[config.name] = new Table(config);
    });

}

export function unsubscribeAll(clientId, queue){
    const subscriptions = _client_subscriptions[clientId];
    if (subscriptions && subscriptions.length){
        subscriptions.forEach(viewport => {
            const subscription = _subscriptions[viewport];
            subscription.cancel()
            delete _subscriptions[viewport];
            queue.purgeViewport(viewport);
        });
        delete _client_subscriptions[clientId];
    }
}

export function AddSubscription(clientId, request, queue){

    const table = getTable(request.tablename);
    _subscriptions[request.viewport] = Subscription(table, request, queue);
    let clientSubscriptions = _client_subscriptions[clientId] || (_client_subscriptions[clientId] = []);
    clientSubscriptions.push(request.viewport);

}

export function TerminateSubscription(clientId, request, queue){
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

export function ModifySubscription(clientId, request, queue){
    _subscriptions[request.viewport].update(request, queue);
}

export function ExpandGroup(clientId, request, queue){
    _subscriptions[request.viewport].update(request, queue);
}

export function CollapseGroup(clientId, request, queue){
    _subscriptions[request.viewport].update(request, queue);	
}

export function GetTableList(clientId, request, queue){

    const {requestId} = request;

    queue.push({
        priority: 1,
        requestId,
        type: 'table-list',
        tables: getTableNames()
    });
}

export function GetTableMeta(clientId, request, queue){

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

export function setViewRange(clientId, request, queue){

    const {viewport, range, useDelta=true, dataType} = request;
    //TODO this can be standardised
    const type = dataType === 'rowData'
        ? DataType.Rowset
        : dataType === 'filterData'
            ? DataType.FilterData
            : dataType === 'searchData' ? DataType.SearchData : null;
        // should be purge the queue of any pending updates outside the requested range ?

    const now = new Date().getTime()
    console.log(' ')
    console.log(`[${now}] DataTableService: setRange ${range.lo} - ${range.hi}`)

    _subscriptions[viewport].invoke('setRange', queue, type, range, useDelta, dataType);

}

export function sort(clientId, {viewport, sortCriteria}, queue){
    _subscriptions[viewport].invoke('sort', queue, DataType.Snapshot, sortCriteria);
}

export function filter(clientId, {viewport, filter, incremental, dataType}, queue){
    _subscriptions[viewport].invoke('filter', queue, DataType.Rowset, filter, dataType, incremental);
}

export function select(clientId, {viewport, idx, rangeSelect, keepExistingSelection}, queue){
    _subscriptions[viewport].invoke('select', queue, DataType.Selected, idx, rangeSelect, keepExistingSelection);
}

export function groupBy(clientId, {viewport, groupBy}, queue){
    _subscriptions[viewport].invoke('groupBy', queue, DataType.Snapshot, groupBy);
}

export function setGroupState(clientId, {viewport,groupState}, queue){
    _subscriptions[viewport].invoke('setGroupState', queue, DataType.Rowset, groupState);
}

export function GetFilterData(clientId, {viewport, column, searchText, range}, queue){
    // TODO what about range ?
    _subscriptions[viewport].invoke('getFilterData', queue, DataType.FilterData, column, searchText, range);
}

export function InsertTableRow(clientId, request, queue){
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
