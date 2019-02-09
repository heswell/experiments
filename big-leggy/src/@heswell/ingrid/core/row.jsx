import React, {useCallback, useEffect, useRef} from 'react';
import cx from 'classnames';
import {getCellRenderer} from '../registry/dataTypeRegistry';

const DEPTH = 1;
const NOOP = () => {}

function useReportChange(props){
    const ref = useRef();

    useEffect(() => {
        ref.current = props;
    })

    const prevProps = ref.current || {}

    const changes = [];
    Object.keys(props).forEach(key => {
        if (props[key] !== prevProps[key]){
            changes.push(key);
        }
    })

    console.log(`${(props.myKey+' ').slice(0,2)} ${props.row[3]}[${props.row[0]}] : ${JSON.stringify(changes)}`)
}

// TODO combine isSelected, isFocused and isLastSelected into a single status
export default React.memo(({
    row,
    isFocused,
    isSelected,
    isLastSelected,
    rowClass,
    onToggle,
    onCellClick,
    onContextMenu=NOOP,
    onDoubleClick=NOOP,
    onSelect,
    cellClass,
    idx,
    myKey,
    columns,
    cellRenderer 
}) => {


    // useReportChange({
    //     idx,
    //     myKey,
    //     row,
    //     isFocused,
    //     isSelected,
    //     isLastSelected,
    //     rowClass,
    //     onToggle,
    //     onCellClick,
    //     onContextMenu,
    //     onDoubleClick,
    //     onSelect,
    //     cellClass,
    //     columns,
    //     cellRenderer         
    // }) 

    const handleContextMenu = useCallback(e => onContextMenu(e, {idx, row}),[idx, row]);
    const handleClick = useCallback(e => {
        const rangeSelect = e.shiftKey;
        const keepExistingSelection = e.ctrlKey || e.metaKey /* mac only */;
        onSelect(idx, row, rangeSelect, keepExistingSelection);
    },[idx, row])
    const handleGroupCellClick = useCallback(cellIdx => {
        onToggle(row);
        onCellClick(idx, cellIdx);
    },[idx, row])

    const groupLevel = row[DEPTH];
    const isGroup = groupLevel !== 0;

    const className = cx(
        'GridRow',
        isFocused ? 'focused' : null,
        isSelected ? 'selected' : null,
        isLastSelected ? 'last-selected' : null,
        rowClass ? rowClass(row) : null,
        isGroup ? `group ${groupLevel < 0 ? 'collapsed' :'expanded'}` : (idx % 2 === 0 ? 'even' : 'odd') 
    );

    const onClick = isGroup ? handleGroupCellClick : onCellClick
    
    const handleDoubleClick = () => onDoubleClick(idx, row);
    
    //TODO load default formatters here and pass formatter/cellClass down to cell 
    const cells = columns.filter(column => !column.hidden).map((column,i) => {

        const props = {
            key: i,
            idx: i,
            rowIdx: idx,
            rowSelected: isSelected,
            row,
            column,
            cellClass,
            onClick
        }

        const renderer = column.renderer || cellRenderer;
        return React.isValidElement(renderer) 
            ? React.cloneElement(renderer,props)
            : (renderer && renderer(props)) || getCellRenderer(props); 
    });

    return (
        <div className={className}
            data_key={myKey}
            tabIndex={0}
            onClick={handleClick} 
            onDoubleClick={handleDoubleClick} 
            onContextMenu={handleContextMenu}>
            {cells}
        </div>
    );
})
 
