
import React, { useRef, useCallback} from 'react';
import cx from 'classnames';
import Draggable from '../draggable/draggable';
import SortIndicator from './sort-indicator';
import ToggleIcon from './toggle-icon';

import './header-cell.css';

const Label = ({ column }) =>
    column.collapsed || column.hidden
        ? ''
        : column.label || '';

export default ({
    className: propClassName,
    column,
    multiColumnSort,
    onClick=() => {},
    onResize,
    onMove,
    onContextMenu
}) => {

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
            onMove('end', column);
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
            onMove('move', column, deltaX);

        } else {
            if (Math.abs(deltaX) > 3) {

                dragging.current = true;
                position.current.x = x;
                position.current.y = y;
                onMove('begin', column, deltaX);
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

    const handleResize = (e) => {
        const width = getWidthFromMouseEvent(e);
        if (width > 0) {
            onResize('resize', column, width);
        }
    }

    const handleResizeEnd = (e) => {
        wasDragging.current = true; // is this right ?
        const width = getWidthFromMouseEvent(e);
        onResize('end', column, width);
    }

    const getWidthFromMouseEvent = e => {
        const right = e.pageX;
        const left = el.current.getBoundingClientRect().left;
        return right - left;
    }

    const className = cx(
        'HeaderCell',
        column.className,
        column.cellCSS,
        propClassName, {
            'HeaderCell--resizing': column.resizing,
            'hidden': column.hidden,
            'collapsed': column.collapsed
        });

    const isResizeable = column.resizeable !== false;
    const isHidden = column.hidden === true;
    const style = { width: column.width };

    if (isHidden && column.width === 0) {
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
            {isResizeable &&
                <Draggable className='resizeHandle'
                    onDrag={handleResize}
                    onDragStart={handleResizeStart}
                    onDragEnd={handleResizeEnd} />
                }
        </div>
    );
}

