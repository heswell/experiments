
import React, { useRef, useCallback, useEffect} from 'react';
import cx from 'classnames';
import Draggable from '../draggable/draggable.jsx';
import SortIndicator from './sort-indicator.jsx';
import ToggleIcon from './toggle-icon.jsx';

import './header-cell.css';

const Label = ({ column }) =>
    column.collapsed || column.hidden
        ? ''
        : column.label || '';

export default ({
    className: propClassName,
    column: col,
    multiColumnSort,
    onClick=() => {},
    onResize,
    onMove,
    onContextMenu
}) => {

    const dragging = useRef(false);
    const wasDragging = useRef(false);
    const column = useRef(col);
    const el = useRef(null);
    const position = useRef({x:0,y:0})

    useEffect(() => {
        column.current = col;
    }, [col])

    const handleClick = () => {

        if (wasDragging.current) {
            wasDragging.current = false;
        } else {
            onClick(column.current);
        }
    }

    const onMouseUp = useCallback(() => {
        cleanUp();
        if (dragging.current) {

            wasDragging.current = true;
            // shouldn't we set dragging to false ?
            onMove('end', column.current);
        } else {
            // drag aborted
        }
    },[])

    const onMouseMove = useCallback(e => {
        console.log(`onMouseMove`)
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
            onMove('move', column.current, deltaX);

        } else {
            if (Math.abs(deltaX) > 3) {

                dragging.current = true;
                position.current.x = x;
                position.current.y = y;
                onMove('begin', column.current, deltaX);
            }
        }
    },[])

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
        onContextMenu(e, 'header', { column: column.current });
    }

    const handleResizeStart = () => onResize('begin', column.current);
    

    const handleResize = useCallback((e) => {
        const width = getWidthFromMouseEvent(e);
        if (width > 0) {
            console.log(`resize ${width} resizing ? ${column.resizing}`)
            onResize('resize', column.current, width);
        }
    },[])

    const handleResizeEnd = (e) => {
        wasDragging.current = true; // is this right ?
        const width = getWidthFromMouseEvent(e);
        onResize('end', column.current, width);
    }

    const getWidthFromMouseEvent = e => {
        const right = e.pageX;
        const left = el.current.getBoundingClientRect().left;
        return right - left;
    }

    const className = cx(
        'HeaderCell',
        col.className,
        col.cellCSS,
        propClassName, {
            'HeaderCell--resizing': col.resizing,
            'hidden': col.hidden,
            'collapsed': col.collapsed
        });

    const style = { width: col.width };

    if (col.hidden && col.width === 0) {
        style.display = 'none';
    }

    return (
        <div ref={el} className={className} style={style}
            onClick={handleClick} onMouseDown={handleMouseDown} onContextMenu={handleContextMenu}>
            <SortIndicator column={col} multiColumnSort={multiColumnSort}/>
            <ToggleIcon column={col}/>
            <div className='InnerHeaderCell'>
                <div className='cell-wrapper'>
                    <Label column={col}/>
                </div>
            </div>
            {col.resizeable !== false &&
                <Draggable className='resizeHandle'
                    onDrag={handleResize}
                    onDragStart={handleResizeStart}
                    onDragEnd={handleResizeEnd} />
                }
        </div>
    );
}

