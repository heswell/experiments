import fs from 'fs';

const data_path = fs.realpathSync(process.cwd());
const project_path = 'src/@heswell/viewserver/dataTables/instruments'

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

export default config;
