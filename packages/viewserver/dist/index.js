'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path$3 = _interopDefault(require('path'));
var url = _interopDefault(require('url'));
var fs = _interopDefault(require('fs'));

//import fs from 'fs';

// const data_path = fs.realpathSync(process.cwd());
const project_path = 'dataTables/instruments';

const data_path = path$3.dirname(new url.URL((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href))).pathname);

const config = {
    name: 'Instruments',
    dataPath: `${data_path}/${project_path}/dataset`,
    createPath: `${data_path}/${project_path}/create-row`,
    updatePath: `${data_path}/${project_path}/update-row`,
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
        interval: 100,
        fields: ['Price'],
        applyInserts: false,
        applyUpdates: false
    }
};

/* global __dirname:false */

// const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const path = fs.realpathSync(process.cwd());

/* global __dirname:false */

// const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const path$1 = fs.realpathSync(process.cwd());

// import path from 'path';
//const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const path$2 = fs.realpathSync(process.cwd());

const data_path$1 = fs.realpathSync(process.cwd());
const project_path$1 = 'src/@heswell/viewserver/dataTables/sets';

const config$1 = {
    name: 'Sets',
    dataPath: `${data_path$1}/${project_path$1}/dataset`,
    // createPath: `${data_path}/${project_path}/create-row`,
    // updatePath: `${data_path}/${project_path}/update-row`,
    type: 'vs',
    primaryKey: 'ISIN',
    columns: [
        {name: 'Segment'},
        {name: 'Sector'},
        {name: 'Issuer Name'},
        {name: 'ISIN'},
        {name: 'Sedol'},
        {name: 'Security Type'},
        {name: 'Currency'},
        {name: 'Trading Parameter Code'},
        {name: "Price Tick Table ID"},
        {name: "Country of Register"},
        {name: "Mnemonic"},
        {name: "Short Name"},
        {name: "Long Name"},
        {name: "EMS"},
        {name: "Max Spread Floor"},
        {name: "Max Spread Perc."},
        {name: "Issuer Version Start Date"},
        {name: "Bid"},
        {name: "Ask"},
        {name: "Last"},
        {name: "Bid Vol"},
        {name: "Ask Vol"},
   
    ],
    // updates: {
    //     interval: 100,
    //     fields: ['Price'],
    //     applyInserts: false,
    //     applyUpdates: false
    // }
};

const data_path$2 = fs.realpathSync(process.cwd());
const project_path$2 = 'src/@heswell/viewserver/dataTables/order-blotter';

const config$2 = {
    name: 'order-blotter',
    dataPath: `${data_path$2}/${project_path$2}/dataset`,
    // createPath: `${data_path}/${project_path}/create-row`,
    // updatePath: `${data_path}/${project_path}/update-row`,
    type: 'vs',
    primaryKey: 'OrderId',
    columns: [
        {name: 'OrderId'},
        {name: 'Status'},
        {name: 'Direction'},
        {name: 'ISIN'},
        {name: 'Quantity'},
        {name: 'Price'},
        {name: 'Currency'},
        {name: 'timestamp'},
    ],
    // updates: {
    //     interval: 100,
    //     fields: ['Price'],
    //     applyInserts: false,
    //     applyUpdates: false
    // }
};

const data_path$3 = fs.realpathSync(process.cwd());
const project_path$3 = 'src/@heswell/viewserver/dataTables/order-book';

const config$3 = {
    name: 'order-book',
    dataPath: `${data_path$3}/${project_path$3}/dataset`,
    // createPath: `${data_path}/${project_path}/create-row`,
    // updatePath: `${data_path}/${project_path}/update-row`,
    type: 'vs',
    primaryKey: 'Id',
    columns: [
        {name: 'Id'},
        {name: 'ISIN'},
        {name: 'Level'},
        {name: 'Bid'},
        {name: 'Bid Volume'},
        {name: 'Bid Party'},
        {name: 'Ask'},
        {name: 'Ask Volume'},
        {name: 'Ask Party'},
        {name: 'timestamp'},
    ],
    // updates: {
    //     interval: 100,
    //     fields: ['Price'],
    //     applyInserts: false,
    //     applyUpdates: false
    // }
};

// TODO unify these with server-api/messages
const ServerApiMessageTypes = {
  addSubscription: 'AddSubscription'
};

const data_path$4 = path$3.dirname(new url.URL((typeof document === 'undefined' ? new (require('u' + 'rl').URL)('file:' + __filename).href : (document.currentScript && document.currentScript.src || new URL('index.js', document.baseURI).href))).pathname);

const ServiceDefinition = {
  name: 'DataTableService',
  module: `${data_path$4}/DataTableService`,
  API: [
      'GetTableList',
      'GetTableMeta',
      ServerApiMessageTypes.addSubscription,
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
        // InstrumentPrices,
        // TestTable,
        // CreditMatrix
    ]
};

exports.config = config$4;
