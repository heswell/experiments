import React from 'react';
import {getGridCellClassName} from '../../cell-utils'
import {rowUtils} from '../../../../data';

export default React.memo(({value, cellClass, column, row, rowSelected}) => {
    return (
        <div
            className={getGridCellClassName(column, value, cellClass)}
            style={{ width: column.width }}
            tabIndex={0} >
            {!rowUtils.isEmptyRow(row) && 
                <input type='checkbox' readOnly checked={rowSelected}/>
            }
        </div>
    );
})
// original checked row.length as part of shouldComponentUpdate