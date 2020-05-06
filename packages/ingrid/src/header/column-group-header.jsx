import React, {useContext, useCallback, useRef, useImperativeHandle, useMemo, forwardRef} from 'react';
import cx from 'classnames';
import HeaderCell from './header-cell.jsx';
import GroupbyHeaderCell from './group-header-cell.jsx';
import * as Action from '../model/actions';
import GridContext from '../grid-context';

import './column-group-header.css';

/** @type {ColumnGroupHeaderComponent} */
const ColumnGroupHeader = forwardRef(function ColumnGroupHeader({
    columnGroup,
    colHeaderRenderer,
    groupState,
    height: displayHeight,
    onColumnMove,
    sortBy,
    width: displayWidth
},ref) {

    const {dispatch, showContextMenu} = useContext(GridContext);
    const scrollableHeaderCells = useRef(null);

    useImperativeHandle(ref, () => ({
        scrollLeft: scrollLeft => {
            scrollableHeaderCells.current.style.transform = `translate3d(-${scrollLeft}px, 0px, 0px)`;
        }
      }))

    const handleColumnResize = useCallback((phase, column, width) => {
        if (phase === 'resize') {
            if (column.isHeading) {
                dispatch({ type: Action.RESIZE_HEADING, column, width });
            } else {
                // TODO do we need to consider scrolling ?
                if (width !== column.width){
                    dispatch({ type: Action.COLUMN_RESIZE, column, width });
                }
            }
        } else if (phase === 'begin') {
            dispatch({ type: Action.COLUMN_RESIZE_BEGIN, column });
        } else if (phase === 'end') {
            dispatch({ type: Action.COLUMN_RESIZE_END, column });
        }
    },[]);

    const handleRemoveGroupBy = useCallback(column => {
        dispatch({ type: Action.groupExtend, column });
    },[]);

    const handleHeaderCellClick = useCallback(column => {
        if (column.sortable !== false) {
            // this will transform the columns which will cause whole grid to re-render down to cell level. All
            // we really need if for headers to rerender. SHould we store sort criteria outside of columns ?
            dispatch({ type: Action.SORT, column });
        }
    },[]);

    const handleToggleGroupState = useCallback((column, expanded) => {
        const groupState = expanded === 1
            ? { '*': true }
            : {};
        dispatch({ type: Action.TOGGLE, groupState })
    },[]);

    const renderColHeadings = heading =>
        heading.map((item, idx) =>
            <HeaderCell
                key={idx}
                className={cx('colgroup-header', { bottomless: item.label === '' })}
                column={item}
                onResize={handleColumnResize}
                onMove={onColumnMove}
                onContextMenu={showContextMenu}
            />
        )

    const renderHeaderCells = (columns, sortBy, groupState) => {
        // this will benefit us when we stop regenerating columnGroup columns on every initialize
        return useMemo(() => columns.filter(column => !column.hidden).map(column => {

            const props = {
                key: column.key,
                column,
                onResize: handleColumnResize,
                onMove: onColumnMove,
                onContextMenu: showContextMenu
            };

            const multiColumnSort = sortBy && sortBy.length > 1;

            if (column.isGroup) {

                return renderGroupHeader({
                    ...props,
                    groupState,
                    onClick: handleGroupHeaderCellClick,
                    onToggleGroupState: handleToggleGroupState,
                    onRemoveColumn: handleRemoveGroupBy
                });

            } else {

                return renderCell({
                    ...props,
                    value: column.name,
                    multiColumnSort,
                    onClick: handleHeaderCellClick
                });
            }
        }),[columns, sortBy, groupState]);
    };

    const renderGroupHeader = (props) => {

        return <GroupbyHeaderCell {...props} />;

    }

    // TODO separate this pattern into reusable code
    const renderCell = (props) => {

        const renderer = colHeaderRenderer;

        return React.isValidElement(renderer)
            ? React.cloneElement(renderer, props)
            : ((renderer && renderer(props)) || <HeaderCell {...props} />);

    }

    const handleGroupHeaderCellClick = useCallback(column => {
        if (column.sortable !== false) {
            dispatch({ type: Action.SORT_GROUP, column });
        }
    },[])

    const { columns, width, headings = [] } = columnGroup;

    return (
        <div className='ColumnGroupHeader' style={{width: displayWidth, height: displayHeight}}>

            {headings.map((heading, idx) =>
                <div className='group-heading' key={idx} style={{ width }}>
                    {renderColHeadings(heading)}
                </div>
            ).reverse()}

            <div className="header-cells" ref={scrollableHeaderCells} style={{ whiteSpace: 'nowrap', width, position: 'relative' }}>
                {renderHeaderCells(columns, sortBy, groupState)}
            </div>
        </div>
    );
});

export default ColumnGroupHeader;
