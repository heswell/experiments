import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import {LocalDataView as View, FilterDataView} from '@heswell/data';
import {SetFilter} from '@heswell/ingrid-extras';

const tableName = 'Instruments'
const dataConfig = {url: '/dataTables/instruments.js', tableName};


const nameColumn = { name: 'Name', width: 200};

const instrumentColumns = [
  { name: 'Symbol', width: 120} ,
  nameColumn ,
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
const filterView = new FilterDataView(dataView, nameColumn);

const SampleApp = () => {

  const [filter, setFilter] = useState(null);

  useEffect(() => {
    dataView.subscribe({
      columns: instrumentColumns},
      ({filter}) => {
        filter && setFilter(filter)
      }).then(() => {
        console.log(`SampleApp, subscribed`)
        dataView.getFilterData(nameColumn)
      });
  },[dataView])

  return (
        <div className='ColumnFilter FilterPanel'>
          <SetFilter
            className='test-filter'
            style={{height: 500, width: 300}}
            column={nameColumn}
            filter={filter}
            dataView={filterView}
          />
        </div>
    )
}

ReactDOM.render(
  <SampleApp />,
  document.getElementById('root'));
  
