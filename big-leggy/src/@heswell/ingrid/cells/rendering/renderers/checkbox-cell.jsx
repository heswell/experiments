import React from 'react';
import {getGridCellClassName} from '../../cell-utils'
import {rowUtils} from '../../../../data';
import './checkbox-cell.css';

export default React.memo(({value, cellClass, column, row, rowSelected}) => {
    return (
        <div
            className={getGridCellClassName(column, value, cellClass)}
            style={{ width: column.width }}
            tabIndex={0} >
            {!rowUtils.isEmptyRow(row) && 
                <div className="checkbox">
                    <i className="material-icons">{rowSelected ? 'check_box_outline' : 'check_box_outline_blank'}</i>
                </div>
            }
        </div>
    );
})
// original checked row.length as part of shouldComponentUpdate