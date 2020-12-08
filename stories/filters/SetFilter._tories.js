import React, {useEffect, useMemo, useState} from 'react';
import {LocalDataSource, FilterDataSource} from '@heswell/data-source';

import { SetFilter } from '@heswell/filter';

export default {
  title: 'Filter/SetFilter',
  component: SetFilter
};

const nameColumn = { name: 'Name', width: 200};

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

export const DefaultSetFilter = () => {
  const column = schema.columns[1];
  const dataSource = useMemo(() => new LocalDataSource(dataConfig),[]);
  const filterSource = useMemo(() => new FilterDataSource(dataSource, column),[]);

  useEffect(() => {
    dataSource.subscribe({
      columns: schema.columns
    },
      ({filter, stats}) => {
        console.log(`stats from dataSource ${JSON.stringify(stats)}`)
      }
      );
  },[dataSource])

  return (
    <SetFilter 
      column={column}
      dataSource={filterSource}
      style={{width: 300, height: 350}}
    />
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
