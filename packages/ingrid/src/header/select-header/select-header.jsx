// @ts-check
/**
 * Used in conjunction with a Checkbox selection model to offer select all and deselect all.
 * 
 * @typedef {import('./select-header').default} SelectHeader 
 * @typedef {import('./select-header').Stats} Stats 
 */
import React, {memo, useEffect, useState} from 'react';

import './select-header.css';

/** @type {Stats} */
const defaultStats = {
  filteredRowCount: 0,
  filteredSelected: 0
};

/** @type {SelectHeader} */
const SelectHeader = memo(({
  dataView,
  style
}) => {
  
  const [stats, setStats] = useState(defaultStats);

  const onStats = (_, stats) => setStats(stats)
  const {filteredRowCount=0, filteredSelected=0} = stats;
  console.log(`render select header filteredRowCount ${filteredRowCount} filteredSelected ${filteredSelected}`)
  const selectionState = filteredRowCount === 0
    ? 'init'
    : filteredRowCount === filteredSelected
      ? 'all-selected'
      : filteredSelected === 0
        ? 'none-selected'
        : 'some-selected';

  useEffect(() => {
    dataView.on('data-count', onStats);
  },[dataView])

  const onClick = () => {
    if (selectionState === 'all-selected'){
      dataView.selectNone();
      // dataView.filter({type: IN, colName: dataView.column.name, values: []}, DataTypes.ROW_DATA, true);
    } else if (selectionState !== 'init'){
      dataView.selectAll();
      // dataView.filter({type: NOT_IN, colName: dataView.column.name, values: []}, DataTypes.ROW_DATA, true);
    }
  }


  const [text, selected] = selectionState === 'init'
    ? ['', false]
    : selectionState === 'all-selected'
      ? ['EXCLUDE ALL', true]
      : ['INCLUDE ALL', false];

  return(
    <div className='SelectHeader' style={style}>
        <div className="checkbox" onClick={onClick}>
            <i className="material-icons">{selected ? 'check_box_outline' : 'check_box_outline_blank'}</i>
        </div>
        <span className='select-header-text'>{text}</span>
      </div>
  )
});

export default SelectHeader;