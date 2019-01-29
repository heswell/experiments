/* global __dirname:false */
//import path from 'path';
// import url from 'url';
import fs from 'fs';

// const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const __dirname = fs.realpathSync(process.cwd());
//const resolveApp = relativePath => path.resolve(appDirectory, relativePath);


const config = {
    name: 'InstrumentPrices',
    dataPath: `${__dirname}/data-generator`,
    // createPath: `${__dirname}/create-row.js`,
    // updatePath: `${__dirname}/update-row`,
    type: 'vs',
    primaryKey: 'ric',
    columns: [
        {name: 'ric'},
        {name: 'description'},
        {name: 'currency'},
        {name: 'exchange'},
        {name: 'lotsize'}
    ],
    updates: {
        applyInserts: false,
        applyUpdates: false
    }
};

export default config;
