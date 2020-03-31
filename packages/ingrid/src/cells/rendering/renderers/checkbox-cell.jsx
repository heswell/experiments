import React from 'react';
import cx from 'classnames';
import {getGridCellClassName} from '../../cell-utils';
import './checkbox-cell.css';

export default React.memo(({value, cellClass, column, row, meta}) => {
    const className = cx(getGridCellClassName(column, value, cellClass),{
        checked: row[meta.SELECTED] === 1
    });

    return (
        <div className={className} style={{ width: column.width }} tabIndex={0} />
    );
})
// original checked row.length as part of shouldComponentUpdate
