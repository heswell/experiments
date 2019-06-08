import React from 'react';
import ReactDOM from 'react-dom';
// import RemoteView from '../src/@heswell/remote-data/remote-view';
import Grid from '../src/@heswell/ingrid/grid';
import {ColumnPicker} from '../src/@heswell/ingrid-extras';
//import data from '../src/@heswell/viewserver/dataTables/instruments/dataset';
// import { connect as connectServerApi} from '../src/@heswell/remote-data/client-hosted/server-api';
//import View from '../src/@heswell/remote-data/view/remote-data-view';
import View from '../src/@heswell/remote-data/view/local-data-view';

const dataSource = 'local';

const tableName = 'Instruments'
const dataConfig = dataSource === 'remote'
  ? {url: '127.0.0.1:9090', tableName}
  : {url: '/data/instruments.js', tableName}

const columns = [
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

const dataView = new View(dataConfig);

class SampleGrid extends React.Component {
  render(){
    return (
      <div className='sample-grid'>
        <Grid
          height={600}
          width={800}
          dataView={dataView}
          onSelectCell={(rowIdx, idx) => console.log(`sample-grid onSelectCell ${rowIdx}* ${idx}`)}
          columns={columns}/>
      </div>
    )
  }
}

const colPickerStyle = {
  width: 400,
  height: 300,
  backgroundColor: 'white'
}  

ReactDOM.render(
  <>
    <SampleGrid />
    {/* <ColumnPicker availableColumns={columns} columns={columns} style={colPickerStyle}/> */}
  </>,
  document.getElementById('root'));


