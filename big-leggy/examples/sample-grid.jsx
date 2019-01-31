import React from 'react';
import ReactDOM from 'react-dom';
import Grid from '../src/@heswell/ingrid/grid';
import {data} from '../src/@heswell/viewserver/dataTables/instruments/dataset';


// const locked = true;

const columns = [
  { name: 'Symbol', width: 120} ,
  { name: 'Name', width: 200} ,
  { name: 'MarketCap', type: 'number', aggregate: 'sum' },
  { name: 'Price', type: { name: 'number', formatting: { decimals:2, zeroPad: true }}},
  { name: 'IPO'},
  { name: 'Sector'},
  { name: 'Industry'}
];

class SampleGrid extends React.Component {
  render(){
    return (
      <div className='sample-grid'>
        <Grid height={400} width={800} data={data} columns={columns}/>
      </div>
    )
  }
}

ReactDOM.render(
  <SampleGrid />,
  document.getElementById('root'));
