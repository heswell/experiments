import React from 'react';
import ReactDOM from 'react-dom';
// import RemoteView from '../src/@heswell/remote-data/remote-view';
import { PopupService } from '../src/@heswell/ingrid';

import Grid from '../src/@heswell/ingrid/grid';
import {ColumnPicker, Dialog} from '../src/@heswell/ingrid-extras';
//import data from '../src/@heswell/viewserver/dataTables/instruments/dataset';
// import { connect as connectServerApi} from '../src/@heswell/remote-data/client-hosted/server-api';
//import View from '../src/@heswell/remote-data/view/remote-data-view';
import View from '../src/@heswell/remote-data/view/local-data-view';
import { relative } from 'path';

const dataSource = 'local';

const tableName = 'Instruments'
const dataConfig = dataSource === 'remote'
  ? {url: '127.0.0.1:9090', tableName}
  : {url: '/data/instruments.js', tableName}

  const setsColumns = [
    { name: 'Segment', width: 80} ,
    { name: 'Sector', width: 80} ,
    { name: 'Issuer Name', width: 300},
    { name: 'ISIN',width: 120},
    { name: 'Currency', width: 80},
    { name: 'Bid Vol', width: 80, type: 'number', heading: ['Vol', 'Bid']},
    { name: 'Bid', width: 80, type: 'number', heading: ['Price','Bid']},
    { name: 'Ask', width: 80, type: 'number', heading: ['Price','Ask']},
    { name: 'Ask Vol', width: 80, type: 'number', heading: ['Vol', 'Ask']},
    { name: 'Last', width: 80, type: 'number'}
  
  ];
  
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

  PopupService.showPopup({
    component: (
      <Dialog title='Grid Columns' buttons={['Cancel', 'OK']} onButtonClick={columnPickerButton}>
        <ColumnPicker
          availableColumns={columns}
          columns={columns} style={colPickerStyle}
          onChange={handleColumnChange}
          />
      </Dialog>
    )
  })

  function columnPickerButton(key){
    console.log(`key = ${key}`)
    if (key === 'OK'){
      console.log(`Apply changes`)
    }
    PopupService.hidePopup();
  }

  function handleColumnChange({columns}){
    console.log(`Sample Grid >> handleColumnChange ${JSON.stringify(columns,null,2)}`)
  }
  
