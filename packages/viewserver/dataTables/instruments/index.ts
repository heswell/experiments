import path from 'path';
import fs from 'fs';

const path_root = 'node_modules/@heswell/viewserver/dist/dataTables';

const project_path = path.resolve(fs.realpathSync('.'), `${path_root}/instruments`);

const config = {
  name: 'instruments',
  dataPath: `${project_path}/data-generator.js`,
  type: 'vs',
  primaryKey: 'ric',
  columns: [
    { name: 'bbg' },
    { name: 'currency' },
    { name: 'description' },
    { name: 'exchange' },
    { name: 'ric' },
    { name: 'isin' },
    { name: 'lotSize', type: 'int' }
  ]
};

export default config;
