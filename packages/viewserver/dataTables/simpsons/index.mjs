import path from 'path';
import fs from 'fs';

const project_path = path.resolve(fs.realpathSync('.'), 'packages/viewserver/dataTables/simpsons');

const config = {
    name: 'Simpsons',
    dataPath: `${project_path}/data-generator`,
    type: 'vs',
    primaryKey: 'seq',
    columns: [
        {name: 'seq'},
        {name: 'name'},
        {name: 'client'},
        {name: 'chg'},
        {name: 'bid'},
        {name: 'ask'},
        {name: 'vol'},
        {name: 'lastUpdate'}
    ],
    updates: {
        applyInserts: false,
        applyUpdates: false
    }
};

export default config;
