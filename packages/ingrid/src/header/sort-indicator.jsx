import React from 'react';
import SortIcon, {Direction} from './sort-icon.jsx';

export default ({column, multiColumnSort}) => {
  const {sortable, sorted, isPlaceHolder} = column;

  if (sortable === false || isPlaceHolder || !sorted) {
    return null;
  }

  const direction = sorted < 0
    ? Direction.DSC
    : Direction.ASC;

  return multiColumnSort ? (
      <div className={`sort-col multi-col ${direction}`}>
          <SortIcon direction={direction}/>
          <span className='sort-col-num'>{Math.abs(sorted)}</span>
      </div>
  ) : (
      <div className="sort-col single-col">
          <SortIcon direction={direction}/>
      </div>

  )
}