import React, {useCallback} from 'react';
import {renderCellContent} from './formatting/cellValueFormatter';
import {getGridCellClassName} from './cell-utils'

export default React.memo(props => {
    const {idx, column, value, cellClass, onClick, onKeyDown, onDoubleClick} = props;
    const style = {width: column.width};

    const clickHandler = useCallback(() => {
        onClick(idx);
    },[idx, onClick])

    return (
        <div className={getGridCellClassName(column, value, cellClass)} 
            style={style} tabIndex={0}
            onKeyDown={onKeyDown}
            onClick={clickHandler}
            onDoubleClick={onDoubleClick}>

            {renderCellContent(props)}
        
        </div>
    );
})

