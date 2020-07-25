import path from 'path';
import fs from 'fs';

const path_root = 'node_modules/@heswell/viewserver/dist/dataTables';
const project_path = path.resolve(fs.realpathSync('.'), `${path_root}/order-blotter`);

const config = {
    name: 'OrderBlotter',
    dataPath: `${project_path}/dataset`,
    createPath: `${project_path}/create-row`,
    // updatePath: `${project_path}/update-row`,
    type: 'vs',
    primaryKey: 'OrderId',
    columns: [
        {name: 'OrderId'},
        {name: 'ParentOrderId'},
        {name: 'Status'},
        {name: 'Direction'},
        {name: 'Symbol'},
        {name: 'InstrumentName'},
        {name: 'Account'},
        {name: 'ISIN'},
        {name: 'CUSIP'},
        {name: 'Quantity', type: 'number', aggregate: 'sum'},
        {name: 'OrderType'},
        {name: 'TimeInForce'},
        {name: 'Expiry'},
        {name: 'LimitPrice'},
        {name: 'Exchange'},
        {name: 'timestamp'},
    ],
    updates: {
        applyInserts: false,
        insertInterval: 100,
        applyUpdates: false,
        interval: 1000,
        fields: ['Quantity']
    }
};

export default config;
