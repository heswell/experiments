//import fs from 'fs';
import path from 'path';

const project_path = path.resolve(__dirname, 'dataTables/instruments');

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
        interval: 100,
        fields: ['Price'],
        applyInserts: false,
        applyUpdates: false
    }
};

export default config;
