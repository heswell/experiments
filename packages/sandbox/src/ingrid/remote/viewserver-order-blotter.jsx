import React from 'react';
import ReactDOM from 'react-dom';
import {Grid } from '@heswell/ingrid';
import {RemoteDataView as View} from '@heswell/data-remote';

const tableName = 'OrderBlotter'
const dataConfig = {url: '127.0.0.1:9090', tableName};

const dataView = new View(dataConfig);

const SampleGrid = () => {

  return (
      <div className='sample-grid'>
        <Grid
          height={600}
          width={1100}
          dataView={dataView}
          onSelectCell={(rowIdx, idx) => console.log(`sample-grid onSelectCell ${rowIdx}* ${idx}`)}
        />
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
  
