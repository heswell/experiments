import { DataTypes, columnUtils } from '@heswell/data';
import { uuid } from '@heswell/utils';

let _connectionId = 0;

const connectionId = {
  get nextValue(){
    return _connectionId++;
  }
};

const msgType = {
  connect : 'connect',
  connectionStatus : 'connection-status',
  rowData : 'rowData',
  rowSet: 'rowset',
  select : 'select',
  selected: 'selected',
  snapshot : 'snapshot',
  update: 'update',

  addSubscription: 'AddSubscription',
  collapseGroup : 'CollapseGroup',
  columnList : 'ColumnList',
  data : 'data',
  expandGroup : 'ExpandGroup',
  filter : 'filter',
  filterData : 'filterData',
  getFilterData : 'GetFilterData',
  getSearchData : 'GetSearchData',
  groupBy : 'groupBy',
  modifySubscription : 'ModifySubscription',
  searchData : 'searchData',
  setColumns: 'setColumns',
  setGroupState : 'setGroupState',
  setViewRange : 'setViewRange',
  size : 'size',
  sort : 'sort',
  subscribed : 'Subscribed',
  tableList : 'TableList',
  unsubscribe : 'TerminateSubscription',
  viewRangeChanged : 'ViewRangeChanged',
};

const logColor = {
  plain : 'color: black; font-weight: normal',
  blue : 'color: blue; font-weight: bold',
  brown : 'color: brown; font-weight: bold',
  green : 'color: green; font-weight: bold',
};

const {plain} = logColor;
const createLogger = (source, labelColor=plain, msgColor=plain) => ({
  log: (msg, args='') => console.log(`[${Date.now()}]%c[${source}] %c${msg}`,labelColor, msgColor, args),
  warn: (msg) => console.warn(`[${source}] ${msg}`)
});

// const serverProxy = new ServerProxy(messageFromTheServer);

const serverProxies = new WeakMap();
const servers = new WeakMap();

const getServerProxy = async serverName => {
  return serverProxies[serverName] || (serverProxies[serverName] =
    import(/* webpackIgnore: true */`./server-proxy/${serverName}.js`));
};
const getServer = async (serverName, url, messageFromTheServer) => {
  if (servers[url]){
    return servers[url];
  } 

  const {ServerProxy} = await getServerProxy(serverName);
  return servers[url] = Promise.resolve(new ServerProxy(messageFromTheServer));

};
  
  
var ConnectionManager = {
  async connect({serverName, url}){
    console.log(`ConnectionManager.connect ${serverName} ${url}`);

    const server = await getServer(serverName, url);
    console.log(`connection-manager got proxy`,server);

    const connectionId$1 = `connection-${connectionId.nextValue}`;
    server.connect({ connectionId: connectionId$1, connectionString: url, callback: message => {
      console.log(`message = `, message);
    }});



    return server;

  }
};

const { metaData } = columnUtils;
const logger = createLogger('RemoteDataView', logColor.blue);

const AvailableProxies = {
  Viewserver: 'viewserver', 
  Vuu: 'vuu'
};

/*----------------------------------------------------------------
  Set up the Server Proxy
  ----------------------------------------------------------------*/
  // TODO isn't it more natural to pass messageFromTheServer to subscribe ?
// const serverProxy = new ServerProxy(messageFromTheServer);
//let serverProxy;

const postMessageToServer = async (message) => {
//  serverProxy.handleMessageFromClient(message);
};

const defaultRange = { lo: 0, hi: 0 };

/*----------------------------------------------------------------
  connection/subscription management
  ----------------------------------------------------------------*/
const clientId = uuid(); // what purpose does this serve ?
let pendingConnection = new Promise((resolve, reject) => {
});


/*-----------------------------------------------------------------
 A RemoteDataView manages a single subscription via the ServerProxy
  ----------------------------------------------------------------*/
class RemoteDataView  {

  constructor({tableName, serverName = AvailableProxies.Viewserver, url}) {

    this.url = url;
    this.serverName = serverName;
    this.tableName = tableName;

    this.server = null;  
    this.columns = null;
    this.meta = null;
    this.subscription = null;
    this.viewport = null;
    this.filterDataCallback = null;
    this.filterDataMessage = null;

  }

  async subscribe({
    viewport = uuid(),
    tableName = this.tableName,
    columns,
    range = defaultRange,
    ...options
  }, callback) {

    if (!tableName) throw Error("RemoteDataView subscribe called without table name");
    if (!columns) throw Error("RemoteDataView subscribe called without columns");

    this.viewport = viewport;
    this.tableName = tableName;
    this.columns = columns;
    this.meta = metaData(columns);
    logger.log(`range = ${JSON.stringify(range)}`);

    this.server = await ConnectionManager.connect(this);
    console.log(`>>>>>>>>> server created`, this.server);

    // could we pass all this into the call above ?
    // this.subscription = subscribe({
    //   ...options,
    //   viewport,
    //   tablename: tableName,
    //   columns,
    //   range
    // }, /* postMessageToClient */(message) => {

    //   const { filterData, data, updates } = message;
    //   if ((data && data.rows) || updates) {
    //     callback(data || message);
    //   } else if (filterData && this.filterDataCallback) {
    //     this.filterDataCallback(message)
    //   } else if (filterData) {
    //     // experiment - need to store the column as well
    //     this.filterDataMessage = message;
    //   } else if (data && data.selected){
    //     // TODO think about this
    //     const {selected, deselected} = data;
    //     callback({range, selected, deselected});
    //   }

    // });

  }

  unsubscribe() {

  }

  setRange(lo, hi) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.setViewRange,
      range: { lo, hi },
      dataType: DataTypes.ROW_DATA
    });
  }

  select(idx, _row, rangeSelect, keepExistingSelection){
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.select,
      idx,
      rangeSelect,
      keepExistingSelection
    });
  }

  group(columns) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.groupBy,
      groupBy: columns
    });
  }

  setGroupState(groupState) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.setGroupState,
      groupState
    });
  }

  sort(columns) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.sort,
      sortCriteria: columns
    });
  }

  filter(filter, dataType = DataTypes.ROW_DATA, incremental=false) {
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.filter,
      dataType,
      filter,
      incremental
    });
  }

  getFilterData(column, searchText) {
    if (this.subscription) {
      this.subscription.getFilterData(column, searchText);
    }
  }

  subscribeToFilterData(column, range, callback) {
    logger.log(`<subscribeToFilterData>`);
    this.filterDataCallback = callback;
    this.setFilterRange(range.lo, range.hi);
    if (this.filterDataMessage) {
      callback(this.filterDataMessage);
      // do we need to nullify now ?
    }

  }

  unsubscribeFromFilterData() {
    logger.log(`<unsubscribeFromFilterData>`);
    this.filterDataCallback = null;
  }

  // To support multiple open filters, we need a column here
  setFilterRange(lo, hi) {
    console.log(`setFilerRange ${lo}:${hi}`);
    postMessageToServer({
      viewport: this.viewport,
      type: msgType.setViewRange,
      dataType: DataTypes.FILTER_DATA,
      range: { lo, hi }
    });

  }

}

export { RemoteDataView, AvailableProxies as Servers, connectionId, createLogger, logColor, msgType };
//# sourceMappingURL=index.js.map
