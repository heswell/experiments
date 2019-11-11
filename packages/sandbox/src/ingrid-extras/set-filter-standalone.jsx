import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import {LocalDataView as View} from '@heswell/data';
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

const SampleApp = () => {

  const [filter, setFilter] = useState(null);

  useEffect(() => {
    dataView.subscribe({
      columns: instrumentColumns},
      ({filter}) => {
        filter && setFilter(filter)
      });
      dataView.getFilterData(nameColumn)
  },[dataView])

  return (
        <div className='ColumnFilter FilterPanel'>
          <SetFilter
            className='test-filter'
            height={500}
            width={400}
            column={nameColumn}
            filter={filter}
            dataView={dataView}
          />
        </div>
    )
}

ReactDOM.render(
  <SampleApp />,
  document.getElementById('root'));
  
