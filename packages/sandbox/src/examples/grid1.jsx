import React from 'react';
import {Grid } from '@heswell/ingrid';
import {LocalDataSource as View} from '@heswell/data';

const tableName = 'Instruments'
const dataConfig = {url: '/dataTables/instruments.js', tableName};
  
const instrumentColumns = [
  { name: 'Symbol', width: 120} ,
  { name: 'Name', width: 200} ,
  { name: 'Price', 
    type: { 
      name: 'number', 
      renderer: {name: 'background', flashStyle:'arrow-bg'},
      formatting: { decimals:2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  { name: 'MarketCap', type: 'number', aggregate: 'sum' },
  { name: 'IPO'},
  { name: 'Sector'},
  { name: 'Industry'}
];

const columns = instrumentColumns;

const dataView = new View(dataConfig);

export default () => 
    <Grid
      style={{height: 600, width: 1100}}
      dataView={dataView}
      onSelectCell={(rowIdx, idx) => console.log(`sample-grid onSelectCell ${rowIdx}* ${idx}`)}
      columns={columns}/>;
  
