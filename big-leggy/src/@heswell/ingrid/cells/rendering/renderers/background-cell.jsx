import React, { useState } from 'react';
import { renderCellContent } from '../../formatting/cellValueFormatter';
import { getGridCellClassName } from '../../cell-utils'
import { Data } from '../../../../data';

import './background-cell.css';

const CHAR_ARROW_UP = String.fromCharCode(11014);
const CHAR_ARROW_DOWN = String.fromCharCode(11015);
const KEY = Data.KEY_FIELD;

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

export default React.memo(props => {

  const { column, row, value, cellClass}  = props;
  
  const [prevColumn, setColumn] = useState(column);
  const [prevRow, setRow] = useState(row);
  const [prevValue, setValue] = useState()
  const [prevDirection, setDirection] = useState('');

  const { width, type: { renderer: { flashStyle } } } = column;

  let direction = prevDirection;

  if (column !== prevColumn || row[KEY] !== prevRow[KEY]) {
    setColumn(column);
    setRow(row);
  } else if (value !== prevValue) {
    direction = getDirection(prevDirection, prevValue, value, column)
    setValue(value);
    setDirection(direction)
  }

  const arrow = flashStyle === FlashStyle.ArrowOnly || flashStyle === FlashStyle.ArrowBackground
    ? direction === UP1 || direction === UP2 ? CHAR_ARROW_UP :
      direction === DOWN1 || direction === DOWN2 ? CHAR_ARROW_DOWN : null
    : null;

  const dirClass = direction ? ` ` + direction : '';
  const arrowClass = flashStyle === FlashStyle.ArrowOnly ? ' arrow-only' :
    flashStyle === FlashStyle.ArrowBackground ? ' arrow' : '';
  return (
    <div
      className={`${getGridCellClassName(column, value, cellClass)}${dirClass}${arrowClass}`}
      style={{ width }}>
      <div className='flasher'>{arrow}</div>
      {renderCellContent(props)}
    </div>
  );
})

function getDirection(direction, prevValue, newValue, column) {
  if (!Number.isFinite(newValue)) {
    return '';
  } else {
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


