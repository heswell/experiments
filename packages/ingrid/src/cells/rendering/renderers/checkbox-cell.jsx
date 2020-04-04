/**
 * @typedef {import('./checkbox-cell').CheckboxCellComponent} CheckboxCell
 */
import React from 'react';
import cx from 'classnames';
import {getGridCellClassName} from '../../cell-utils';
import './checkbox-cell.css';

/** @type {CheckboxCell} */
const CheckboxCell = React.memo(function CheckboxCell({column, row, meta}){
    const className = cx(getGridCellClassName(column),{
        checked: row[meta.SELECTED] === 1
    });
    return (
        <div className={className} style={{ width: column.width }} tabIndex={0} />
    );
})

export default CheckboxCell;