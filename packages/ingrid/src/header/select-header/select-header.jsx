import React, {memo, useEffect, useState} from 'react';
import {filter, DataTypes} from '@heswell/data';

import './select-header.css';

export default memo(({
  dataView,
  isSelected=false,
  style
}) => {

  const [dataCounts, setDataCounts] = useState({});

  const onDataCount = (_, dataCounts) => setDataCounts(dataCounts)
  const {filterRowTotal=0, filterRowSelected=0} = dataCounts;
  const selectionState = filterRowTotal === 0
    ? 'init'
    : filterRowTotal === filterRowSelected
      ? 'all-selected'
      : filterRowSelected === 0
        ? 'none-selected'
        : 'some-selected';

  useEffect(() => {
    dataView.on('data-count', onDataCount);
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