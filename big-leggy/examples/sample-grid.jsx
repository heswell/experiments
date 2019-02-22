import React from 'react';
import ReactDOM from 'react-dom';
import Grid from '../src/@heswell/ingrid/grid';
// import data from '../src/@heswell/viewserver/dataTables/instruments/dataset';
import { connect/*, subscribe2 */} from '../src/@heswell/server-api/serverApi2';


// const locked = true;

const columns = [
  { name: 'Symbol', width: 120} ,
  { name: 'Name', width: 200} ,
  { name: 'Price', type: { name: 'number', 
    renderer: {name: 'background', flashStyle:'arrow-bg'},
    formatting: { decimals:2, zeroPad: true }}},
  { name: 'MarketCap', type: 'number', aggregate: 'sum' },
  { name: 'IPO'},
  { name: 'Sector'},
  { name: 'Industry'}
];

class SampleGrid extends React.Component {
  render(){
    return (
      <div className='sample-grid'>
        <Grid
          height={600}
          width={800}
          // data={data} 
          tablename="Instruments" 
          columns={columns}/>
      </div>
    )
  }
}

ReactDOM.render(
  <SampleGrid />,
  document.getElementById('root'));

connect('127.0.0.1:9090');
