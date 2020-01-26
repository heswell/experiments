import React from 'react';
import {Grid } from '@heswell/ingrid';
import {RemoteDataView as View, Servers} from '@heswell/data-remote';

const dataConfig = {
  serverName: Servers.Vuu,
  tableName: 'instrumentPrices', 
  url: '127.0.0.1:8090/websocket'
};

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

export default () => {

  return (
        <Grid
          style={{height:600, width: 1100}}
          dataView={dataView}
          onSelectCell={(rowIdx, idx) => console.log(`sample-grid onSelectCell ${rowIdx}* ${idx}`)}
          columns={columns}/>
    )
}

const colPickerStyle = {
  width: 400,
  height: 300,
  backgroundColor: 'white'
}  
  
