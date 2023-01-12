import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { TableConfig } from 'packages/server-core/src';

const path_root = 'node_modules/@heswell/viewserver/dist/dataTables';

const project_path = path.resolve(fs.realpathSync('.'), `${path_root}/instrumentPrices`);

const config = {
  name: 'InstrumentPrices',
  dataPath: pathToFileURL(`${project_path}/data-generator.js`),
  type: 'vs',
  primaryKey: 'ric',
  columns: [
    { name: 'ric' },
    { name: 'description' },
    { name: 'currency' },
    { name: 'exchange' },
    { name: 'lotsize' }
  ],
  updates: {
    applyInserts: false,
    applyUpdates: false
  }
};

export default config;
