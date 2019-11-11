import React from 'react';
import cx from 'classnames';

export const FilterPanelHeader = ({column, onMouseDown}) =>
  <div className='col-header HeaderCell' onMouseDown={onMouseDown}>
    <div className='col-header-inner' style={{ width: column.width - 1 }}>{column.name}</div>
  </div>
