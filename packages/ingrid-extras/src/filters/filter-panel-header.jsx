import React from 'react';

export const FilterPanelHeader = ({column, onMouseDown}) =>
  <div className='FilterPanelHeader col-header HeaderCell' onMouseDown={onMouseDown}>
    <div className='col-header-inner' style={{ width: column.width - 1 }}>{column.name}</div>
  </div>
