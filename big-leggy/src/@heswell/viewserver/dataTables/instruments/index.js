/* global __dirname:false */
//import path from 'path';
//import url from 'url';
import fs from 'fs';

//const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const __dirname = fs.realpathSync(process.cwd());

const config = {
    name: 'Instruments',
    dataPath: `${__dirname}/dataset`,
    createPath: `${__dirname}/create-row`,
    updatePath: `${__dirname}/update-row`,
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
        interval: 1000,
        fields: ['Price'],
        applyInserts: false,
        applyUpdates: false
    }
};

export default config;
