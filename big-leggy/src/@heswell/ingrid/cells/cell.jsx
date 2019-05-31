import React, {useCallback} from 'react';
import {renderCellContent} from './formatting/cellValueFormatter';
import {getGridCellClassName} from './cell-utils'

import './cell.css';

export default React.memo(({
    idx,
    column,
    row,
    onClick
}) => {
    const style = {width: column.width};
    const value = row[column.key]

    const clickHandler = useCallback(() => {
        onClick(idx);
    },[idx, onClick])
    

    return (
        <div className={getGridCellClassName(column, value)} 
            style={style}
            tabIndex={0}
            onClick={clickHandler}>
            {renderCellContent({column,row })}
        </div>
    );
})

