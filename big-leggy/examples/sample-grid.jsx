import React from 'react';
import ReactDOM from 'react-dom';
import Table from '../src/@heswell/data/store/table';
import {LocalView} from '../src/@heswell/data/view';
import RemoteView from '../src/@heswell/remote-data/remote-view';
import Grid from '../src/@heswell/ingrid/grid';
import {ColumnPicker} from '../src/@heswell/ingrid-extras';
//import data from '../src/@heswell/viewserver/dataTables/instruments/dataset';
import { connect as connectServerApi} from '../src/@heswell/remote-data/client-hosted/server-api';
import { connect as connectRemoteDataView } from '../src/@heswell/remote-data/remote-data-view';
import {subscribe as subscribeRemoteDataView} from '../src/@heswell/remote-data/remote-data-view';

const data= null;

const locked = true;

const tablename = 'Instruments'
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

let view;

if (data){
  const table = new Table({data, columns});
  // note, we can also pass groupBy, sortCriteria etc etc
  view = new LocalView({table});
} else {
  view = new RemoteView({tablename, columns});
  connectServerApi('127.0.0.1:9090');
  connectRemoteDataView('127.0.0.1:9090');
}

class SampleGrid extends React.Component {
  render(){
    return (
      <div className='sample-grid'>
        <Grid
          height={600}
          width={800}
          dataView={view} 
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


const subscription1 = subscribeRemoteDataView({
    viewport: 'test-vp-id-1',
    tablename: 'Instruments',
    columns,
    range: {lo:0, hi: 10}
});

// const subscription2 = subscribeRemoteDataView({
//   viewport: 'test-vp-id-2',
//   tablename: 'Instruments'
//   columns
// });

// const subscription3 = subscribeRemoteDataView({
//   viewport: 'test-vp-id-3',
//   tablename: 'Instruments'
//   columns
// });
