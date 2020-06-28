import React from 'react';
import {Grid } from '@heswell/ingrid';
import {RemoteDataSource as View} from '@heswell/data-remote';

const tableName = 'Instruments'
const dataConfig = {url: '127.0.0.1:9090', tableName};
  
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

export default () => {

  return (
      <div className='sample-grid'>
        <Grid
          style={{height:600, width: 1100}}
          rowStripes
          dataSource={dataView}
          onSelectCell={(rowIdx, idx) => console.log(`sample-grid onSelectCell ${rowIdx}* ${idx}`)}
          columns={columns}/>
      </div>
    )
}

const colPickerStyle = {
  width: 400,
  height: 300,
  backgroundColor: 'white'
}  
  
