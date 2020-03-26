import React, {useCallback} from 'react';
import {renderCellContent} from './formatting/cellValueFormatter';
import {getGridCellClassName} from './cell-utils'
import useCellComponent from './use-cell-renderer';

import './cell.css';

export default React.memo(function Cell({
    idx,
    column,
    meta,
    row,
    onClick
}){
    // get the cell renderer here, using column
    // if there isn't one, use the default rendering below
    const cellComponent = useCellComponent(column);
    const style = {width: column.width};
    const value = row[column.key]

    const clickHandler = useCallback(() => {
        onClick(idx);
    },[idx, onClick])
    
    const Type = cellComponent.current;
    if (Type){
        return <Type idx={idx} column={column} meta={meta} row={row} onClick={clickHandler}/>
    }

    return (
        <div className={getGridCellClassName(column, value)} 
            style={style}
            tabIndex={0}
            onClick={clickHandler}>
            {renderCellContent({column,row })}
        </div>
    );
})

