import path from 'path';
import fs from 'fs';

const project_path = path.resolve(fs.realpathSync('.'), 'packages/viewserver/dataTables/instrumentPrices');

const config = {
    name: 'InstrumentPrices',
    dataPath: `${project_path}/data-generator`,
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
