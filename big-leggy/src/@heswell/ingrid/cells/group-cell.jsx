import React, {useCallback} from 'react';
import {getGridCellClassName} from './cell-utils';

import './group-cell.css';

const DEPTH = 1;
const CHILD_COUNT = 2;

export default React.memo(({value, idx, cellClass, row, column, onClick}) => {

    const clickHandler = useCallback(e => {
        e.preventDefault();
        e.stopPropagation();
        onClick(idx);
    },[idx, onClick])

    const isExpanded = row[DEPTH] > 0;

    return (
        <div 
            className={getGridCellClassName(column, value, cellClass)}
            style={{ width: column.width }} tabIndex={0} >
            {getContent(row, column.columns, isExpanded, clickHandler)}
        </div>
    );
})

function getContent(row, columns, rowExpanded, onClick) {

    const count = row[CHILD_COUNT];
    const result = getValue(row,columns)

    if (result) {
        const [value, depth] = result;
        return (
            <div className='GroupCell' style={{ paddingLeft: depth * 20 }} tabIndex={0}
                onClick={onClick}>
                <i className='material-icons icon'>{rowExpanded ? 'arrow_drop_down' : 'arrow_right'}</i>
                <span className='group-value'>{value}</span>
                <span> ({count})</span>
            </div>
        );
    }
}

function getValue(row, columns){
    const depth = Math.abs(row[DEPTH]);
    for (let i=0;i<columns.length;i++){
        const column = columns[i];
        if (column.groupLevel === depth) {
            return [row[column.key],i];
        }
    }
    return null;
}
