import path from 'path';
import fs from 'fs';

const project_path = path.resolve(fs.realpathSync('.'), 'packages/viewserver/dataTables/order-blotter');

const config = {
    name: 'OrderBlotter',
    dataPath: `${project_path}/dataset`,
    createPath: `${project_path}/create-row`,
    // updatePath: `${project_path}/update-row`,
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
    updates: {
        interval: 1000,
        fields: ['Quantity'],
        applyInserts: true,
        applyUpdates: false
    }
};

export default config;
