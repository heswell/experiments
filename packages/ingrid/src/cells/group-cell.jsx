import React, {useCallback} from 'react';
import {getGridCellClassName} from './cell-utils';

import './group-cell.css';

export default React.memo(({value, idx, cellClass, row, column, onClick, meta}) => {

    const clickHandler = useCallback(e => {
        e.preventDefault();
        e.stopPropagation();
        onClick(idx);
    },[idx, onClick])

    const isExpanded = row[meta.DEPTH] > 0;

    return (
        <div 
            className={getGridCellClassName(column, value, cellClass)}
            style={{ width: column.width }} tabIndex={0} >
            {getContent(row, column.columns, meta, isExpanded, clickHandler)}
        </div>
    );
})

function getContent(row, columns, meta, rowExpanded, onClick) {

    const count = row[meta.COUNT];
    const result = getValue(row,columns, meta)

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

function getValue(row, columns, meta){
    const depth = Math.abs(row[meta.DEPTH]);
    for (let i=0;i<columns.length;i++){
        const column = columns[i];
        if (column.groupLevel === depth) {
            return [row[column.key],i];
        }
    }
    return null;
}
