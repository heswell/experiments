/* global __dirname:false */
// import path from 'path';
// import url from 'url';
import fs from 'fs';

// const __dirname = path.dirname(new url.URL(import.meta.url).pathname);
const path = fs.realpathSync(process.cwd());

const config = {
    name: 'TestTable',
    dataPath: `${path}/data-generator`,
    createPath: `${path}/create-row.mjs`,
    updatePath: `${path}/update-row`,
    type: 'vs',
    primaryKey: 'Column-1',
    columns: [
        { name: 'Column-1', 'type': 'string' },
        { name: 'Column-2', 'type': 'string' },
        { name: 'Column-3', 'type': 'number' },
        { name: 'Column-4', 'type': 'number' },
        { name: 'Column-5', 'type': 'number' },
        { name: 'Column-6', 'type': 'string' },
        { name: 'Column-7', 'type': 'string', 'value': 'group1' },
        { name: 'Column-8', 'type': 'number' },
        { name: 'Column-9', 'type': 'number' },
        { name: 'Column-10', 'type': 'number' },
        { name: 'Column-11', 'type': 'number' },
        { name: 'Timestamp', 'type': 'datetime' },
        { name: 'AutoInc', 'type': 'increment' }
    ],
    updates: {
        interval: 30000,
        applyInserts: true,
        applyUpdates: false

    }
};

export default config;
