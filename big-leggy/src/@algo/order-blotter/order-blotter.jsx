import React from 'react';
import Grid from '../../../src/@heswell/ingrid/grid';
import { FlexBox } from '../../../src/@heswell/inlay';
import { Titlebar } from '../../../src/@algo'

import './order-blotter.css';

const statusIndRenderer = (props) => {
  const {column, row, meta} = props;
  console.log(`${JSON.stringify(row)}`,column, meta)
  // TODO meta needs to include all column names as well
  const key = row[meta.KEY]
  const status = row[2]
  const side = row[3]
  return (
    <div key={props.key} style={{width: column.width}} className="GridCell order-status-ind">
    {key != null && (
      <div className={`${side} ${status} indicator`}>
        {status === 'done' && <div className="fill"/>}
      </div>
    )}
    </div>
  )
}

const columns = [
  {name: 'status-ind', width: 40, label: '', renderer: statusIndRenderer},
  {name: 'OrderId'},
  {name: 'Status'},
  {name: 'Direction'},
  {name: 'ISIN'},
  {name: 'Quantity', type: 'number'},
  {name: 'Price', type: 'number'}
]

export default function({
  style,
  dataView
}){

  return (
    <FlexBox style={style}>
      <Titlebar style={{height: 32}}>
      </Titlebar>
      <Grid 
        className="OrderBlotter"
        style={{flex: 1}}
        dataView={dataView}
        columns={columns}
      />
    
    </FlexBox>
)
} 