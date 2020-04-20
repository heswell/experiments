/**
 * @typedef {import('./cell').CellComponent} Cell
 */
import React, {useCallback, useEffect, useRef} from 'react';
import {renderCellContent} from './formatting/cellValueFormatter';
import {getGridCellClassName} from './cell-utils'
import useCellComponent from './use-cell-renderer';

import './cell.css';

function useLog(props){
    const isFirstUpdate = useRef(true);
    const prevProps = React.useRef(null);

    useEffect(() => {
        console.log(`%cCell mounted <${props._key}>`,'color:red;font-weight:bold;');
        return () => {
            console.log(`%cCell unmounted <${props._key}>`,'color:red;font-weight:bold;');
        }
    },[])

    useEffect(() => {
        if (isFirstUpdate.current){
            isFirstUpdate.current = false;
        } else {

            const changes = Object.entries(props).reduce((str, [key, value]) => {
                const prevValue = prevProps.current[key];
                return str + `\n${key}\t${value === prevValue ? 'same' : 'changed'}`;
            }, '-------------------------Cell Update')

            console.log(changes);
        }
        prevProps.current = props;
    })

}

/** @type {Cell} */
const Cell = React.memo(function Cell({
    column,
    meta,
    onClick,
    row,
}){
    // useLog({ column, meta, row, onClick})
    // get the cell renderer here, using column
    // if there isn't one, use the default rendering below
    const cellComponent = useCellComponent(column);
    const style = {width: column.width};

    const clickHandler = useCallback(() => {
        onClick(column.key);
    },[column.key, onClick])
    
    const Type = cellComponent.current;
    if (Type){
        return <Type column={column} meta={meta} row={row} onClick={clickHandler}/>
    }

    return (
        <div className={getGridCellClassName(column)} 
            style={style}
            tabIndex={0}
            onClick={clickHandler}>
            {renderCellContent({column,row })}
        </div>
    );
})

export default Cell;