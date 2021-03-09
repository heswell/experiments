import React, {useEffect, useMemo, useState} from 'react';
import {LocalDataSource, FilterDataSource} from '@heswell/data-source';
import { FilterCounts, FilterPanel, SetFilter } from '@heswell/filter';
import { DataTypes, STARTS_WITH } from '@heswell/utils';

import './fonts.css';

export default {
  title: 'Filter/FilterPanel',
  component: FilterPanel
};


const nameColumn = { name: 'Name', width: 200};
const noop = () => void(0);

const schema = {
  columns: [
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
]};
const dataConfig = {dataUrl: '/data/instruments.js', schema};

export const DefaultFilterPanel = () => {
  const column = schema.columns[1];
  const dataSource = useMemo(() => new LocalDataSource(dataConfig),[]);
  const filterSource = useMemo(() => new FilterDataSource(dataSource, column),[]);
  const [filter, setFilter] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    filterSource.on('data-count', (_, stats) => {
      console.log(`stats from emit`, stats)
      setStats(stats)
    });
    dataSource.subscribe({
      columns: schema.columns
    },
      ({filter, stats}) => {
        console.log(`stats from dataSource subscription ${JSON.stringify(stats)}`)
        filter && setFilter(filter)
      });

  
  },[dataSource])

  const handleSearch = value => {
    filterSource.filter({type: STARTS_WITH, colName: 'name', value}, DataTypes.FILTER_DATA, true);
  }

  return (
    <FilterPanel
      style={{width: 300, height: 350}}
      column={nameColumn}
      onHide={noop}
      onMouseDown={noop}
      onSearch={handleSearch}>
      <SetFilter
        style={{flex:1}}
        column={nameColumn}
        filter={filter}
        dataSource={filterSource}
      />
      <FilterCounts
          column={column}
          style={{ height: 50 }}
          stats={stats} />

    </FilterPanel>
)
}

  /*
export const DefaultSetFilter = () => {
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
    filterSource.filter({type: STARTS_WITH, colName: 'name', value}, DataTypes.FILTER_DATA, true);
  }


  return (
        <FilterPanel
          style={{width: 300, height: 350}}
          column={nameColumn}
          onHide={noop}
          onMouseDown={noop}
          onSearch={handleSearch}>
          
          <SetFilter
            className='test-filter'
            style={{flex:1}}
            column={nameColumn}
            filter={filter}
            dataSource={filterSource}
            stats={stats}
          />
        </FilterPanel>
    )
}
*/
