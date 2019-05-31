import React from 'react';
import ReactDOM from 'react-dom';
import {FlexBox} from '../src/@heswell/inlay';
import Grid from '../src/@heswell/ingrid/grid';
import RemoteDataView from '../src/@heswell/remote-data/view/remote-data-view';
import {AppHeader} from '../src/@algo'
import {Orderbook, Chart, Blotter} from '../src/@algo'

const WS_URL = '127.0.0.1:9090';
const SETS_TABLE = 'Sets';
const ORDER_BLOTTER_TABLE = 'order-blotter';
const ORDER_BOOK_TABLE = 'order-book';

const columns = [
  { name: 'Segment', width: 80} ,
  { name: 'Sector', width: 80} ,
  { name: 'Issuer Name', width: 300},
  { name: 'ISIN',width: 120},
  { name: 'Currency', width: 80},
  { name: 'Bid', width: 80, type: 'number'},
  { name: 'Ask', width: 80, type: 'number'},
  { name: 'Last', width: 80, type: 'number'},
  { name: 'Bid Vol', width: 80, type: 'number'},
  { name: 'Ask Vol', width: 80, type: 'number'},

];

const setsDataView = new RemoteDataView(WS_URL, SETS_TABLE);
const ordersDataView = new RemoteDataView(WS_URL, ORDER_BLOTTER_TABLE);
const orderBookDataView = new RemoteDataView(WS_URL, ORDER_BOOK_TABLE);

class App extends React.Component {
  render(){
    const {width, height} = document.body.getBoundingClientRect();

    return (
      <FlexBox style={{width, height, flexDirection: 'column'}}>
        <AppHeader style={{height: 80}} /> 
        <FlexBox style={{flexDirection: 'row', flex: 1}} resizeable>
          <Grid style={{flex: 1}}
            dataView={setsDataView}
            onSelectCell={(rowIdx, idx) => console.log(`sample-grid onSelectCell ${rowIdx}* ${idx}`)}
            columns={columns}
            resizeable/>
            <Orderbook style={{width:600}} dataView={orderBookDataView} />
        </FlexBox>
        <FlexBox style={{flexDirection: 'row', flex: 1}} resizeable>
          <Blotter style={{flex:1}} resizeable dataView={ordersDataView}/>
          <Chart style={{flex:1}} resizeable/>
        </FlexBox>
      </FlexBox>
    )
  }
}

ReactDOM.render(
    <App />,
  document.getElementById('root'));


