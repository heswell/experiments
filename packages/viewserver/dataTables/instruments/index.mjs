import path from 'path';
import fs from 'fs';

const path_root = 'node_modules/@heswell/viewserver/dist/dataTables';

const project_path = path.resolve(fs.realpathSync('.'), `${path_root}/instruments`);

const config = {
    name: 'Instruments',
    dataPath: `${project_path}/dataset`,
    createPath: `${project_path}/create-row`,
    updatePath: `${project_path}/update-row`,
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
        interval: 40,
        fields: ['Price'],
        applyInserts: false,
        applyUpdates: true
    }
};

export default config;
