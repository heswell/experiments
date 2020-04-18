import React from 'react';
import {Grid } from '@heswell/ingrid';
import {LocalDataSource as View} from '@heswell/data-source';

 
const data = [];
const columns = [{name: 'id', width: 200}, {name:'ccy', width: 200}];

const start = performance.now();
for (let i = 2 ; i < 1000; i++){
  columns.push({name: `${i-1}M`, width: 200});
}

for (let i=0;i<1000;i++){
  const row = {id: i, ccy: 'USDGBP'};
  for (let j=2;j<1000;j++){
    row[`${j-1}M`] = `${i},${j-1}`;
  }
  data.push(row);
}

const end = performance.now();
console.log(`creating data took ${(end-start)} ms`)

const dataView = new View({data});

export default () => 
    <Grid
      style={{height: 800, width: 1100}}
      dataSource={dataView}
      headerHeight={32}
      onSelectCell={(rowIdx, idx) => console.log(`sample-grid onSelectCell ${rowIdx}* ${idx}`)}
      rowHeight={27}
      columns={columns}/>;
  
