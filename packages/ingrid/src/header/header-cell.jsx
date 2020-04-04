/** @typedef {import('./header-cell').HeaderCellComponent} HeaderCell */
import React, { useRef, useCallback, useEffect} from 'react';
import cx from 'classnames';
import Draggable from '../draggable/draggable.jsx';
import SortIndicator from './sort-indicator.jsx';
import ToggleIcon from './toggle-icon.jsx';
import {getFormatter} from '../registry/datatype-registry.jsx';

import './header-cell.css';

const Label = ({ column }) =>
    column.collapsed || column.hidden
        ? ''
        : column.label || '';

/** @type {HeaderCell} */
const HeaderCell = ({
    className: propClassName,
    column,
    multiColumnSort,
    onClick=() => {},
    onResize,
    onMove,
    onContextMenu
}) => {

    const col = useRef(column);
    // essential that handlers for resize do not use stale column
    // we could mitigate this by only passing column key and passing delta,
    // so we don't rely on current width in column
    col.current = column;

    const dragging = useRef(false);
    const wasDragging = useRef(false);
    const el = useRef(null);
    const position = useRef({x:0,y:0})

    const handleClick = () => {

        if (wasDragging.current) {
            wasDragging.current = false;
        } else {
            onClick(column);
        }
    }

    const onMouseUp = useCallback(() => {
        cleanUp();
        if (dragging.current) {

            wasDragging.current = true;
            // shouldn't we set dragging to false ?
            onMove('end', col.current);
        } else {
            // drag aborted
        }
    },[column])

    const onMouseMove = useCallback(e => {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        if (e.preventDefault) {
            e.preventDefault();
        }

        const x = e.clientX;
        const y = e.clientY;
        const deltaX = x - position.current.x;

        if (dragging.current) {
            position.current.x = x;
            position.current.y = y;
            onMove('move', col.current, deltaX);

        } else {
            if (Math.abs(deltaX) > 3) {

                dragging.current = true;
                position.current.x = x;
                position.current.y = y;
                onMove('begin', col.current, deltaX);
            }
        }
    },[column])

    const handleMouseDown = e => {
        position.current = {x: e.clientX, y: e.clientY};
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mousemove', onMouseMove);
    }

    const cleanUp = () => {
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('mousemove', onMouseMove);
    }

    const handleContextMenu = e => {
        onContextMenu(e, 'header', { column });
    }

    const handleResizeStart = () => onResize('begin', column);
    

    const handleResize = useCallback((e) => {
        const width = getWidthFromMouseEvent(e);
        if (width > 0) {
            onResize('resize', col.current, width);
        }
    },[])

    const handleResizeEnd = (e) => {
        wasDragging.current = true; // is this right ?
        const width = getWidthFromMouseEvent(e);
        onResize('end', col.current, width);
    }

    const getWidthFromMouseEvent = e => {
        const right = e.pageX;
        const left = el.current.getBoundingClientRect().left;
        return right - left;
    }

    // relic
    const {cellCSS} = getFormatter(column.type);

    const className = cx(
        'HeaderCell',
        column.className,
        cellCSS(column.type), // deprecated
        propClassName, {
            'HeaderCell--resizing': column.resizing,
            'hidden': column.hidden,
            'collapsed': column.collapsed
        });

    const style = { width: column.width };

    if (column.hidden && column.width === 0) {
        style.display = 'none';
    }

    return (
        <div ref={el} className={className} style={style}
            onClick={handleClick} onMouseDown={handleMouseDown} onContextMenu={handleContextMenu}>
            <SortIndicator column={column} multiColumnSort={multiColumnSort}/>
            <ToggleIcon column={column}/>
            <div className='InnerHeaderCell'>
                <div className='cell-wrapper'>
                    <Label column={column}/>
                </div>
            </div>
            {column.resizeable !== false &&
                <Draggable className='resizeHandle'
                    onDrag={handleResize}
                    onDragStart={handleResizeStart}
                    onDragEnd={handleResizeEnd} />
                }
        </div>
    );
}

export default HeaderCell;