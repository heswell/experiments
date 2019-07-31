import React, {useCallback, useContext/*, useEffect, useRef*/} from 'react';
import cx from 'classnames';
import {getCellRenderer} from '../registry/dataTypeRegistry';
import GridContext from '../grid-context';
import * as Action from '../model/actions';

export default React.memo(({
    row,
    idx,
    columns,
    gridModel
}) => {

    const {meta, rowHeight} = gridModel;
    const handleContextMenu = useCallback(e => showContextMenu(e, 'row', {idx, row}),[idx, row]);
    const {dispatch, callbackPropsDispatch, showContextMenu} = useContext(GridContext);

    const handleClick = useCallback(e => {
        const rangeSelect = e.shiftKey;
        const keepExistingSelection = e.ctrlKey || e.metaKey /* mac only */;
        console.log(`Row about to call callbackPropsDIspatch('selection')`);
        callbackPropsDispatch({type:'selection', idx, row, rangeSelect, keepExistingSelection})
    },[idx, row])

    const handleDoubleClick = useCallback(() => callbackPropsDispatch({type: 'double-click', idx, row}),[idx, row]);

    const onClick = useCallback(cellIdx => {
        if (isGroup){
            dispatch({ type: Action.TOGGLE, groupRow: row });
        }
        callbackPropsDispatch({type: 'select-cell', idx, cellIdx})
    },[idx, row])

    const groupLevel = row[meta.DEPTH];
    const isGroup = groupLevel !== 0;
    const isSelected = row[meta.SELECTED] === 1;

    const className = cx(
        'GridRow',
        isSelected ? 'selected' : null,
        isGroup 
            ? `group ${groupLevel < 0 ? 'collapsed' :'expanded'}`
            : (idx % 2 === 0 ? 'even' : 'odd') 
    );

    //TODO load default formatters here and pass formatter/cellClass down to cell 
    const cells = columns.filter(column => !column.hidden).map((column,i) => {

        const props = {
            key: i,
            idx: i,
            column,
            meta,
            row,
            onClick
        }

        return React.isValidElement(column.renderer) 
            ? React.cloneElement(column.renderer,props)
            : (column.renderer && column.renderer(props)) || getCellRenderer(props); 
    });

    return (
        <div className={className}
            tabIndex={0}
            style={{transform: `translate3d(0px, ${idx*rowHeight}px, 0px)`}}
            onClick={handleClick} 
            onDoubleClick={handleDoubleClick} 
            onContextMenu={handleContextMenu}>
            {cells}
        </div>
    );
})
 
