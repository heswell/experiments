import React from 'react';
import ReactDOM from 'react-dom';
import {Grid } from '@heswell/ingrid';
import {RemoteDataView as View} from '@heswell/data-remote';

const tableName = 'Simpsons'
const dataConfig = {url: '127.0.0.1:9090', tableName};

  
const instrumentColumns = [
  { name: 'seq', width: 60} ,
  { name: 'name', width: 200} ,
  { name: 'client', width: 200} ,
  { name: 'chg', 
    type: { 
      name: 'number', 
      renderer: {name: 'background', flashStyle:'arrow-bg'},
      formatting: { decimals:2, zeroPad: true }
    }
  },
  { name: 'bid', 
    type: { 
      name: 'number', 
      renderer: {name: 'background', flashStyle:'arrow-bg'},
      formatting: { decimals:2, zeroPad: true }
    }
  },
  { name: 'ask', 
    type: { 
      name: 'number', 
      renderer: {name: 'background', flashStyle:'arrow-bg'},
      formatting: { decimals:2, zeroPad: true }
    }
  },
  { name: 'vol', type: 'number', aggregate: 'sum' },
  { name: 'lastUpdate'}
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
  
