// @ts-check
import React, {useEffect, useState} from 'react';
import {LocalDataSource, FilterDataSource, DataTypes, filter as filterUtils} from '@heswell/data';
import {FilterPanel, SetFilter} from '@heswell/ingrid-extras';

const tableName = 'Instruments'
const dataConfig = {url: '/dataTables/instruments.js', tableName};

const initialStats = {
  totalRowCount:0, filteredRowCount:0, filteredSelected :0
}

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

const noop = () => undefined;
const dataSource = new LocalDataSource(dataConfig);
const filterSource = new FilterDataSource(dataSource, nameColumn);

export default () => {

  const [filter, setFilter] = useState(null);
  const [stats, setStats] = useState(initialStats);

  console.log(`filter = ${JSON.stringify(filter)}`)

  filterSource.on('data-count', (_, stats) => {
    console.log(`%cstats from filterSource ${JSON.stringify(stats)}`,'color:green;')
    setStats(stats);
  });

  useEffect(() => {
    dataSource.subscribe({
      columns: instrumentColumns},
      ({filter, stats}) => {
        console.log(`stats from dataSource ${JSON.stringify(stats)}`)
        filter && setFilter(filter)
      }).then(() => {
        console.log(`SampleApp, subscribed, now get filterData`)
        // dataSource.getFilterData(nameColumn)
      });
  },[dataSource])

  const handleSearch = value => {
    filterSource.filter({type: filterUtils.STARTS_WITH, colName: 'name', value}, DataTypes.FILTER_DATA, true);
}


  return (
        <FilterPanel
          style={{width: 300, height: 350}}
          column={nameColumn}
          showZeroRows={true}
          onHide={noop}
          toggleZeroRows={noop}
          onMouseDown={noop}
          onSearch={handleSearch}>
          
          <SetFilter
            className='test-filter'
            style={{flex:1}}
            column={nameColumn}
            filter={filter}
            dataView={filterSource}
            stats={stats}
          />
        </FilterPanel>
    )
}
  
