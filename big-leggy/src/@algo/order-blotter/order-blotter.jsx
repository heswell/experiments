import React from 'react';
import Grid from '../../../src/@heswell/ingrid/grid';

import './order-blotter.css';

const columns = [
  {name: 'OrderId'},
  {name: 'Status'},
  {name: 'Direction'},
  {name: 'ISIN'},
  {name: 'Quantity'},
  {name: 'Price'}
]

export default function({
  style,
  dataView
}){

  return (
    <Grid 
      className="OrderBlotter"
      style={style}
      dataView={dataView}
      columns={columns}
    />
)
} 