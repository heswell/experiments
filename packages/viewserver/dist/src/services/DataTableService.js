import Table from "./Table.js";
import Subscription from "./Subscription.js";
import { uuid } from "@heswell/server-core";
const _tables = {};
var _subscriptions = {};
var _client_subscriptions = {};
const _queued_subscriptions = {};
const DataType = {
  Rowset: "rowset",
  Update: "update",
  Snapshot: "snapshot",
  FilterData: "filterData",
  SearchData: "searchData",
  Selected: "selected"
};
const configure = ({ DataTables }) => Promise.all(DataTables.map(async (config) => await createTable(config)));
async function createTable({ dataPath, ...config }) {
  const { name: tablename2 } = config;
  const table = _tables[tablename2] = new Table(config);
  if (dataPath) {
    await table.loadData(dataPath);
  }
  const qs = _queued_subscriptions[tablename2];
  if (qs) {
    console.log(`Table ${tablename2} created and we have queued Subscription(s)}`);
    _queued_subscriptions[tablename2] = void 0;
    qs.forEach(({ clientId, request, queue }) => {
      console.log(`Add Queued Subscription clientId:${clientId}`);
      AddSubscription(clientId, request, queue);
    });
  }
  return table;
}
function GET_TABLE_LIST(sessionId, requestId, request, queue) {
  const tables = getTableNames();
  console.log(`received GET_TABLE_LIST request, requestId ${requestId} tables are ${tables}`);
  queue.push({
    requestId,
    sessionId,
    token: "poo",
    user: "user",
    priority: 1,
    body: {
      requestId,
      type: "TABLE_LIST_RESP",
      tables: tables.map((table) => ({ table, module: "SIMUL" }))
    }
  });
}
function GET_TABLE_META(sessionId, requestId, request, queue) {
  const table = getTable(request.table.table);
  queue.push({
    requestId,
    sessionId,
    token: "poo",
    user: "user",
    priority: 1,
    body: {
      requestId,
      type: "TABLE_META_RESP",
      columns: table.columns.map((col) => col.name),
      dataTypes: table.columns.map((col) => col.type?.name ?? col.type ?? "string"),
      table: request.table
    }
  });
}
function CREATE_VP(sessionId, requestId, request, queue) {
  const {
    table: { table: tableName }
  } = request;
  const table = _tables[tableName];
  if (table.status === "ready") {
    const viewportId = uuid();
    console.log(
      `subscribe to ${tableName}, table is ready ${JSON.stringify(
        request
      )}, viewport id will be ${viewportId}`
    );
    _subscriptions[viewportId] = Subscription(table, viewportId, request, queue);
    let clientSubscriptions = _client_subscriptions[sessionId] || (_client_subscriptions[sessionId] = []);
    clientSubscriptions.push(request.viewport);
  } else {
    const qs = _queued_subscriptions;
    const q = qs[tablename] || (qs[tablename] = []);
    q.push({ sessionId, request, queue });
    console.log(`queued subscriptions for ${tablename} = ${q.length}`);
  }
}
function unsubscribeAll(clientId, queue) {
  const subscriptions = _client_subscriptions[clientId];
  if (subscriptions && subscriptions.length) {
    subscriptions.forEach((viewport) => {
      const subscription = _subscriptions[viewport];
      subscription.cancel();
      delete _subscriptions[viewport];
      queue.purgeViewport(viewport);
    });
    delete _client_subscriptions[clientId];
  }
}
function TerminateSubscription(clientId, request, queue) {
  const { viewport } = request;
  _subscriptions[viewport].cancel();
  delete _subscriptions[viewport];
  _client_subscriptions[clientId] = _client_subscriptions[clientId].filter((vp) => vp !== viewport);
  if (_client_subscriptions[clientId].length === 0) {
    delete _client_subscriptions[clientId];
  }
  queue.purgeViewport(viewport);
}
function ModifySubscription(clientId, request, queue) {
  _subscriptions[request.viewport].update(request, queue);
}
function ExpandGroup(clientId, request, queue) {
  _subscriptions[request.viewport].update(request, queue);
}
function CollapseGroup(clientId, request, queue) {
  _subscriptions[request.viewport].update(request, queue);
}
function GetTableMeta(clientId, request, queue) {
  const { requestId } = request;
  const table = getTable(request.table);
  queue.push({
    priority: 1,
    requestId,
    type: "column-list",
    table: table.name,
    key: "Symbol",
    columns: table.columns
  });
}
function setViewRange(clientId, request, queue) {
  const { viewport, range, useDelta = true, dataType } = request;
  const type = dataType === "rowData" ? DataType.Rowset : dataType === "filterData" ? DataType.FilterData : dataType === "searchData" ? DataType.SearchData : null;
  const now = new Date().getTime();
  console.log(" ");
  console.log(`[${now}] DataTableService: setRange ${range.lo} - ${range.hi}`);
  _subscriptions[viewport].invoke("setRange", queue, type, range, useDelta, dataType);
}
function sort(clientId, { viewport, sortCriteria }, queue) {
  _subscriptions[viewport].invoke("sort", queue, DataType.Snapshot, sortCriteria);
}
function filter(clientId, { viewport, filter: filter2, incremental, dataType }, queue) {
  _subscriptions[viewport].invoke("filter", queue, dataType, filter2, dataType, incremental);
}
function select(clientId, { viewport, idx, rangeSelect, keepExistingSelection, dataType }, queue) {
  _subscriptions[viewport].invoke(
    "select",
    queue,
    DataType.Selected,
    idx,
    rangeSelect,
    keepExistingSelection,
    dataType
  );
}
function selectAll(clientId, { viewport, dataType }, queue) {
  _subscriptions[viewport].invoke("selectAll", queue, DataType.Selected, dataType);
}
function selectNone(clientId, { viewport, dataType }, queue) {
  _subscriptions[viewport].invoke("selectNone", queue, DataType.Selected, dataType);
}
function groupBy(clientId, { viewport, groupBy: groupBy2 }, queue) {
  _subscriptions[viewport].invoke("groupBy", queue, DataType.Snapshot, groupBy2);
}
function setGroupState(clientId, { viewport, groupState }, queue) {
  _subscriptions[viewport].invoke("setGroupState", queue, DataType.Rowset, groupState);
}
function GetFilterData(clientId, { viewport, column, searchText, range }, queue) {
  _subscriptions[viewport].invoke(
    "getFilterData",
    queue,
    DataType.FilterData,
    column,
    searchText,
    range
  );
}
function InsertTableRow(clientId, request, queue) {
  const tableHelper = getTable(request.tablename);
  tableHelper.table.insert(request.row);
  console.warn(`InsertTableRow TODO send confirmation ${queue.length}`);
}
function getTable(name) {
  if (_tables[name]) {
    return _tables[name];
  } else {
    throw Error(`DataTableService. no table definition for ${name}`);
  }
}
function getTableNames() {
  return Object.keys(_tables);
}
export {
  CREATE_VP,
  CollapseGroup,
  ExpandGroup,
  GET_TABLE_LIST,
  GET_TABLE_META,
  GetFilterData,
  GetTableMeta,
  InsertTableRow,
  ModifySubscription,
  TerminateSubscription,
  configure,
  filter,
  groupBy,
  select,
  selectAll,
  selectNone,
  setGroupState,
  setViewRange,
  sort,
  unsubscribeAll
};
//# sourceMappingURL=DataTableService.js.map
