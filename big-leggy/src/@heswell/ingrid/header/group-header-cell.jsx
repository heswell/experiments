import React, {useRef, useEffect, useCallback} from 'react';
import cx from 'classnames';
import Draggable from '../draggable/draggable';
import {expandStatesfromGroupState} from '../model/utils';
import css from '../style/grid';
import './header.css';

const styles = {
    groupByHeaderCell: 'GroupbyHeaderCell'
}

const ColHeader = (props) => {
    const {column, className, onClick, onRemoveColumn, expandState, onToggle} = props
    const expanded = expandState === 1;
    return (
        <div className={cx('ColHeader', className,{expanded, collapsed: !expanded})}>
            <i className='material-icons toggle-icon' onClick={() => onToggle(column, -expandState)}>{expanded ? 'arrow_drop_down' : 'arrow_right'}</i>
            <span className='ColHeaderLabel' onClick={() => onClick(column)}>{column.name}</span>
            <i className='material-icons remove-icon' onClick={() => onRemoveColumn(column)}>cancel</i>
        </div>
    );
};

export default ({
    className: propClassName,
    column: groupCol,
    groupState,
    onClick,
    onContextMenu,
    onRemoveColumn,
    onResize,
    onToggleGroupState}) => {

    const el = useRef(null);
    const column = useRef(groupCol);

    useEffect(() => {
        column.current = groupCol;
    }, [groupCol])

    const handleClick = () => {
        onClick(groupCol);
    }

    // All duplicated in header-cell
    const handleResizeStart = () => onResize('begin', column.current);

    const handleResize = useCallback((e) => {
        const width = getWidthFromMouseEvent(e);
        if (width > 0) {
            onResize('resize', column.current, width);
        }
    },[])

    const handleResizeEnd = (e) => {
        const width = getWidthFromMouseEvent(e);
        onResize('end', column.current, width);
    }

    const getWidthFromMouseEvent = e => {
        const right = e.pageX;
        const left = el.current.getBoundingClientRect().left;
        return right - left;
    }

    const handleContextMenu = e => {
        onContextMenu(e, 'header', { column: groupCol });
    }

        const {columns, resizing, width} = groupCol;
        const className = cx(
            styles.groupByHeaderCell,
            'HeaderCell group',
            propClassName,
            resizing ? 'HeaderCell--resizing': ''
        );
        const expandStates = expandStatesfromGroupState(groupCol, groupState);
        return (
            <div ref={el} className={className} style={{...css.HeaderCell, paddingLeft: 0,width: width}}
                onContextMenu={handleContextMenu}>
                <div className='inner-container'>
                    {columns.map(
                        (column,idx) => <ColHeader
                            key={column.key}
                            column={column}
                            expandState={expandStates[idx]}
                            onClick={handleClick}
                            onRemoveColumn={onRemoveColumn}
                            onToggle={onToggleGroupState}
                            className={columnClassName(columns, idx, column)}
                        />)}
                </div>
                <Draggable className='resizeHandle' onDrag={handleResize} onDragStart={handleResizeStart} onDragEnd={handleResizeEnd} />
            </div>
        );
}

function columnClassName(columns, idx/*, column*/){

    const classes = [];

    if (idx === 0){
        classes.push('first');
    }

    if (idx === columns.length-1){
        classes.push('last');
    }

    return classes.join(' ');

}
