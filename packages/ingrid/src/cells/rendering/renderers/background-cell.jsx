/**
 * @typedef {import('./background-cell').CellComponent} Cell
 */
import React, { useEffect,useRef } from 'react';
import { renderCellContent } from '../../formatting/cellValueFormatter';
import { getGridCellClassName } from '../../cell-utils'

import './background-cell.css';

const CHAR_ARROW_UP = String.fromCharCode(11014);
const CHAR_ARROW_DOWN = String.fromCharCode(11015);

const UP1 = 'up1';
const UP2 = 'up2';
const DOWN1 = 'down1';
const DOWN2 = 'down2';

// TODO these sre repeated from PriceFormatter - where shoud they live ?
const FlashStyle = {
  ArrowOnly: 'arrow',
  BackgroundOnly: 'bg-only',
  ArrowBackground: 'arrow-bg'
};

const INITIAL_VALUE = [null, null, null, null]

function useDirection(key, value, column) {
  const ref = useRef(null);
  const [prevKey, prevValue, prevColumn, prevDirection] = ref.current || INITIAL_VALUE;
  const direction = key === prevKey &&  column === prevColumn && 
    Number.isFinite(prevValue) && Number.isFinite(value)
    ? getDirection(prevDirection, prevValue, value, column)
    : '';

  useEffect(() => {
    ref.current = [key, value, column, direction]
  })

  return direction;
}

const getFlashStyle = (colType) => {
  if (typeof colType === 'string'){
    return FlashStyle.BackgroundOnly;
  } else {
    const {renderer} = colType;
    return (renderer && renderer.flashStyle) || FlashStyle.BackgroundOnly;
  }
}

/** @type {Cell} */
const BackgroundCell = React.memo(function BackgroundCell(props){
  //TODO what about click handling
  const { column, row, meta}  = props;
  const { key, width, type } = column;
  const value = row[key];

  const flashStyle = getFlashStyle(type);

  const direction = useDirection(row[meta.KEY], value, column)

  const arrow = flashStyle === FlashStyle.ArrowOnly || flashStyle === FlashStyle.ArrowBackground
    ? direction === UP1 || direction === UP2 ? CHAR_ARROW_UP :
      direction === DOWN1 || direction === DOWN2 ? CHAR_ARROW_DOWN : null
    : null;

  const dirClass = direction ? ` ` + direction : '';
  const arrowClass = flashStyle === FlashStyle.ArrowOnly ? ' arrow-only' :
    flashStyle === FlashStyle.ArrowBackground ? ' arrow' : '';

  return (
    <div
      className={`${getGridCellClassName(column)}${dirClass}${arrowClass}`}
      style={{ width }}>
      <div className='flasher'>{arrow}</div>
      {renderCellContent(props)}
    </div>
  );
})

function getDirection(direction, prevValue, newValue, column) {
  if (!Number.isFinite(newValue)) {
    return '';
  } else if (prevValue !== null && newValue !== null){
    let diff = newValue - prevValue;
    if (diff) {
      // make sure there is still a diff when reduced to number of decimals to be displayed
      const { type: dataType } = column;
      let decimals = dataType && dataType.formatting && dataType.formatting.decimals;
      if (typeof decimals === 'number') {
        diff = +newValue.toFixed(decimals) - +prevValue.toFixed(decimals);
      }
    }

    if (diff) {
      if (direction === '') {
        if (diff < 0) {
          return DOWN1;
        } else {
          return UP1;
        }
      } else if (diff > 0) {
        if (direction === DOWN1 || direction === DOWN2 || direction === UP2) {
          return UP1;
        } else {
          return UP2;
        }
      } else if (direction === UP1 || direction === UP2 || direction === DOWN2) {
        return DOWN1;
      } else {
        return DOWN2;
      }
    }
  }

}


export default BackgroundCell;