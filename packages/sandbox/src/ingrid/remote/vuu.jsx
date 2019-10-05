import React from 'react';
import ReactDOM from 'react-dom';
import {Grid } from '@heswell/ingrid';
// import data from '@heswell/viewserver/dataTables/instruments/dataset';
import {RemoteDataView as View, Servers} from '@heswell/data-remote';

const tableName = 'instrumentPrices'
const dataConfig = {url: '127.0.0.1:8090/websocket', tableName, server: Servers.Vuu};

[ "currency", "exchange", "lotSize", "bid", "ask", "last", "open", "close", "scenario" ] 
const instrumentColumns = [
  { name: 'ric', width: 120} ,
  { name: 'description', width: 200} ,
  { name: 'currency'},
  { name: 'exchange'},
  { name: 'lotSize', type: {name: 'number' }},
  { name: 'bid', 
    type: { 
      name: 'number', 
      renderer: {name: 'background', flashStyle:'arrow-bg'},
      formatting: { decimals:2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  { name: 'ask', 
    type: { 
      name: 'number', 
      renderer: {name: 'background', flashStyle:'arrow-bg'},
      formatting: { decimals:2, zeroPad: true }
    },
    aggregate: 'avg'
  },
  { name: 'last', type: {name: 'number' }},
  { name: 'open', type: {name: 'number' }},
  { name: 'close', type: {name: 'number' }},
  {name: 'scenario'}
];

const columns = instrumentColumns;

const dataView = new View(dataConfig);

const SampleGrid = () => {

  return (
      <div className='sample-grid'>
        <Grid
          height={600}
          width={1100}
          dataView={dataView}
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

ReactDOM.render(
  <>
    <SampleGrid />
  </>,
  document.getElementById('root'));
  
