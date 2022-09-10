import { ColumnMetaData } from '@heswell/data';
import {
  MessageQueue,
  ServerConfig,
  TableColumnType,
  TableConfig,
  uuid,
  VuuRequestHandler
} from '@heswell/server-core';
import {
  ClientToServerChangeViewPort,
  ClientToServerCreateViewPort,
  ClientToServerMessage,
  ClientToServerTableList,
  ClientToServerTableMeta,
  ClientToServerViewPortRange,
  ServerToClientMessage,
  ServerToClientTableRows
} from '@vuu-ui/data-types';
import { Subscription } from './Subscription.js';
import { Table } from './Table.js';

type QueuedSubscription = {
  message: ClientToServerMessage<ClientToServerCreateViewPort>;
  queue: MessageQueue;
};

const _tables: { [key: string]: Table } = {};
var _subscriptions: { [viewportId: string]: Subscription } = {};
const _queuedSubscriptions: { [tableName: string]: QueuedSubscription[] | undefined } = {};

// TODO unify these with DataTypes
const DataType = {
  Rowset: 'rowset',
  Update: 'update',
  Snapshot: 'snapshot',
  FilterData: 'filterData',
  SearchData: 'searchData',
  Selected: 'selected'
};

// need an API call to expose tables so extension services can manipulate data

export const configure = (props: ServerConfig): Promise<Table[]> => {
  console.log(`DataTableService.configure`, {
    props
  });
  const { DataTables } = props;
  return Promise.all(DataTables.map(async (config) => await createTable(config)));
};

async function createTable({ dataPath, ...config }: TableConfig) {
  const { name: tablename } = config;
  const table = (_tables[tablename] = new Table(config));

  if (dataPath) {
    await table.loadData(dataPath);
  }

  const qs = _queuedSubscriptions[tablename];
  if (qs) {
    console.log(`Table ${tablename} created and we have queued Subscription(s)}`);
    _queuedSubscriptions[tablename] = undefined;
    qs.forEach(({ message, queue }) => {
      console.log(`Add Queued Subscription clientId:${message.sessionId}`);
      CREATE_VP(message, queue);
    });
  }

  return table;
}

export const GET_TABLE_LIST: VuuRequestHandler<ClientToServerTableList> = (message, queue) => {
  const tables = getTableNames();
  console.log(
    `received GET_TABLE_LIST request, requestId ${message.requestId} tables are ${tables}`
  );
  const { sessionId, requestId } = message;
  queue.push({
    requestId,
    sessionId,
    token: 'poo',
    user: 'user',
    priority: 1,
    body: {
      requestId,
      type: 'TABLE_LIST_RESP',
      tables: tables.map((table) => ({ table, module: 'SIMUL' }))
    }
  });
};

export const GET_TABLE_META: VuuRequestHandler<ClientToServerTableMeta> = (message, queue) => {
  const table = getTable(message.body.table.table);
  const { sessionId, requestId } = message;
  queue.push({
    requestId,
    sessionId,
    token: 'poo',
    user: 'user',
    priority: 1,
    body: {
      requestId,
      type: 'TABLE_META_RESP',
      columns: table.columns.map((col) => col.name),
      dataTypes: table.columns.map(
        (col) => (col.type as TableColumnType)?.name ?? col.type ?? 'string'
      ),
      table: message.body.table
    }
  });
};

export const CREATE_VP: VuuRequestHandler<ClientToServerCreateViewPort> = (message, queue) => {
  const {
    table: { table: tableName }
  } = message.body;
  const table = _tables[tableName];
  if (table.status === 'ready') {
    const viewPortId = uuid();
    const subscription = new Subscription(table, viewPortId, message, queue);
    _subscriptions[viewPortId] = subscription;

    queue.push({
      requestId: message.requestId,
      sessionId: '',
      token: '',
      user: '',
      body: {
        ...message.body,
        table: tableName,
        type: 'CREATE_VP_SUCCESS',
        viewPortId
      }
    });

    if (subscription.view.status === 'ready') {
      const { rows, size } = subscription.view.setRange(message.body.range);
      addDataMessagesToQueue(message, rows, size, queue, viewPortId, subscription.metaData);
    }
  } else {
    const queuedSubscription =
      _queuedSubscriptions[tableName] || (_queuedSubscriptions[tableName] = []);
    queuedSubscription.push({ message, queue });
    console.log(`queued subscriptions for ${tableName} = ${queuedSubscription.length}`);
  }
};

export const CHANGE_VP: VuuRequestHandler<ClientToServerChangeViewPort> = (message, queue) => {
  // should be purge the queue of any pending updates outside the requested range ?
  queue.push({
    requestId: message.requestId,
    sessionId: message.sessionId,
    token: '',
    user: '',
    body: {
      ...message.body,
      type: 'CHANGE_VP_SUCCESS'
    }
  });

  const { viewPortId } = message.body;
  const now = new Date().getTime();
  console.log(`[${now}] DataTableService: changeViewport`);
  const subscription = _subscriptions[viewPortId];
  const { rows, size } = subscription.view.changeViewport(message.body);
  // addDataMessagesToQueue(message, rows, size, queue, viewPortId, subscription.metaData);
};

export const CHANGE_VP_RANGE: VuuRequestHandler<ClientToServerViewPortRange> = (message, queue) => {
  const { from, to, viewPortId } = message.body;
  // should be purge the queue of any pending updates outside the requested range ?
  queue.push({
    requestId: message.requestId,
    sessionId: message.sessionId,
    token: '',
    user: '',
    body: {
      from,
      to,
      type: 'CHANGE_VP_RANGE_SUCCESS',
      viewPortId
    }
  });

  const now = new Date().getTime();
  console.log(`[${now}] DataTableService: setRange ${from} - ${to}`);
  const subscription = _subscriptions[viewPortId];
  const { rows, size } = subscription.view.setRange({ from, to });
  addDataMessagesToQueue(message, rows, size, queue, viewPortId, subscription.metaData);
};

export function unsubscribeAll(sessionId: string, queue: MessageQueue) {
  // const subscriptions = _clientSubscriptions[clientId];
  // if (subscriptions && subscriptions.length) {
  //   subscriptions.forEach((viewport) => {
  //     const subscription = _subscriptions[viewport];
  //     subscription.cancel();
  //     delete _subscriptions[viewport];
  //     queue.purgeViewport(viewport);
  //   });
  //   delete _clientSubscriptions[clientId];
  // }
}

export function TerminateSubscription(clientId, request, queue) {
  const { viewport } = request;
  _subscriptions[viewport].cancel();
  delete _subscriptions[viewport];
  // purge any messages for this viewport from the messageQueue
  _clientSubscriptions[clientId] = _clientSubscriptions[clientId].filter((vp) => vp !== viewport);
  if (_clientSubscriptions[clientId].length === 0) {
    delete _clientSubscriptions[clientId];
  }
  queue.purgeViewport(viewport);
}

// SuspendSubscription
// ResumeSUbscription
// TerminateAllSubscriptionsForClient

export function ModifySubscription(clientId, request, queue) {
  _subscriptions[request.viewport].update(request, queue);
}

export function ExpandGroup(clientId, request, queue) {
  _subscriptions[request.viewport].update(request, queue);
}

export function CollapseGroup(clientId, request, queue) {
  _subscriptions[request.viewport].update(request, queue);
}

export function sort(clientId, { viewport, sortCriteria }, queue) {
  _subscriptions[viewport].invoke('sort', queue, DataType.Snapshot, sortCriteria);
}

export function filter(clientId, { viewport, filter, incremental, dataType }, queue) {
  _subscriptions[viewport].invoke('filter', queue, dataType, filter, dataType, incremental);
}

export function select(
  clientId,
  { viewport, idx, rangeSelect, keepExistingSelection, dataType },
  queue
) {
  _subscriptions[viewport].invoke(
    'select',
    queue,
    DataType.Selected,
    idx,
    rangeSelect,
    keepExistingSelection,
    dataType
  );
}

export function selectAll(clientId, { viewport, dataType }, queue) {
  _subscriptions[viewport].invoke('selectAll', queue, DataType.Selected, dataType);
}

export function selectNone(clientId, { viewport, dataType }, queue) {
  _subscriptions[viewport].invoke('selectNone', queue, DataType.Selected, dataType);
}

export function groupBy(clientId, { viewport, groupBy }, queue) {
  _subscriptions[viewport].invoke('groupBy', queue, DataType.Snapshot, groupBy);
}

export function setGroupState(clientId, { viewport, groupState }, queue) {
  _subscriptions[viewport].invoke('setGroupState', queue, DataType.Rowset, groupState);
}

export function GetFilterData(clientId, { viewport, column, searchText, range }, queue) {
  // TODO what about range ?
  _subscriptions[viewport].invoke(
    'getFilterData',
    queue,
    DataType.FilterData,
    column,
    searchText,
    range
  );
}

export function InsertTableRow(clientId, request, queue) {
  const tableHelper = getTable(request.tablename);
  tableHelper.table.insert(request.row);
  console.warn(`InsertTableRow TODO send confirmation ${queue.length}`);
}

function getTable(name: string): Table {
  if (_tables[name]) {
    return _tables[name];
  } else {
    throw Error(`DataTableService. no table definition for ${name}`);
  }
}

function getTableNames() {
  return Object.keys(_tables);
}

const addDataMessagesToQueue = (
  incomingMessage: ClientToServerMessage,
  rows: any[],
  vpSize: number,
  queue: MessageQueue,
  viewPortId: string,
  { IDX, KEY }: ColumnMetaData
) => {
  if (rows.length) {
    const { module, sessionId } = incomingMessage;
    const ts = +new Date();

    const message: ServerToClientMessage<ServerToClientTableRows> = {
      requestId: '',
      sessionId,
      token: '',
      user: 'user',
      module,
      body: {
        batch: 'REQ-0',
        isLast: true,
        rows: [
          {
            data: [],
            rowIndex: -1,
            rowKey: 'SIZE',
            sel: 0,
            ts,
            updateType: 'SIZE',
            viewPortId,
            vpSize,
            vpVersion: ''
          }
        ],
        timeStamp: ts,
        type: 'TABLE_ROW'
      }
    };

    for (let row of rows) {
      const rowIndex = row[IDX];
      message.body.rows.push({
        rowIndex,
        data: row.slice(0, IDX),
        rowKey: row[KEY],
        sel: 0,
        ts,
        updateType: 'U',
        viewPortId,
        vpSize,
        vpVersion: ''
      });
    }

    queue.push(message);
  }
};
