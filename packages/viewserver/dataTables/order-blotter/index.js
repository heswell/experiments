import fs from 'fs';

const data_path = fs.realpathSync(process.cwd());
const project_path = 'src/@heswell/viewserver/dataTables/order-blotter'

const config = {
    name: 'order-blotter',
    dataPath: `${data_path}/${project_path}/dataset`,
    // createPath: `${data_path}/${project_path}/create-row`,
    // updatePath: `${data_path}/${project_path}/update-row`,
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
    // updates: {
    //     interval: 100,
    //     fields: ['Price'],
    //     applyInserts: false,
    //     applyUpdates: false
    // }
};

export default config;
