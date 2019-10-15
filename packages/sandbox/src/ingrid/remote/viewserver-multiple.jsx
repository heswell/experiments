import React from 'react';
import ReactDOM from 'react-dom';
import {Grid } from '@heswell/ingrid';
import {RemoteDataView as View} from '@heswell/data-remote';
  
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

const instrumentPriceColumns = [
  {name: 'ric'},
  {name: 'description'},
  {name: 'currency'},
  {name: 'exchange'},
  {name: 'lotsize'}
]

const SampleGrid = () => {

  return (
      <div className='sample-grids'>
        <Grid
          height={500}
          width={800}
          dataView={new View({url: '127.0.0.1:9090', tableName: 'Instruments'})}
          onSelectCell={(rowIdx, idx) => console.log(`sample-grid onSelectCell ${rowIdx}* ${idx}`)}
          columns={instrumentColumns} />
        <Grid
          height={500}
          width={800}
          dataView={new View({url: '127.0.0.1:9090', tableName: 'InstrumentPrices'})}
          onSelectCell={(rowIdx, idx) => console.log(`sample-grid onSelectCell ${rowIdx}* ${idx}`)}
          columns={instrumentPriceColumns} />
      </div>
    )
}

const colPickerStyle = {
  width: 400,
  height: 300,
  backgroundColor: 'white'
}  

ReactDOM.render(
  <>
    <SampleGrid />
  </>,
  document.getElementById('root'));
  
