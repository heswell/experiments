import fs from 'fs';
import { pathToFileURL } from 'url';

const data_path = fs.realpathSync(process.cwd());
const project_path = 'src/@heswell/viewserver/dist/dataTables/sets';

const config = {
  name: 'Sets',
  dataPath: pathToFileURL(`${data_path}/${project_path}/dataset.js`),
  // createPath: pathToFileURL(`${data_path}/${project_path}/create-row`,
  // updatePath: pathToFileURL(`${data_path}/${project_path}/update-row`,
  type: 'vs',
  primaryKey: 'ISIN',
  columns: [
    { name: 'Segment' },
    { name: 'Sector' },
    { name: 'Issuer Name' },
    { name: 'ISIN' },
    { name: 'Sedol' },
    { name: 'Security Type' },
    { name: 'Currency' },
    { name: 'Trading Parameter Code' },
    { name: 'Price Tick Table ID' },
    { name: 'Country of Register' },
    { name: 'Mnemonic' },
    { name: 'Short Name' },
    { name: 'Long Name' },
    { name: 'EMS' },
    { name: 'Max Spread Floor' },
    { name: 'Max Spread Perc.' },
    { name: 'Issuer Version Start Date' },
    { name: 'Bid' },
    { name: 'Ask' },
    { name: 'Last' },
    { name: 'Bid Vol' },
    { name: 'Ask Vol' }
  ]
  // updates: {
  //     interval: 100,
  //     fields: ['Price'],
  //     applyInserts: false,
  //     applyUpdates: false
  // }
};

export default config;
