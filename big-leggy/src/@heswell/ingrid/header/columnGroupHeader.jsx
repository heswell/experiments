import React, {useContext, useCallback, useRef, useImperativeHandle, forwardRef} from 'react';
import cx from 'classnames';
import HeaderCell from './header-cell';
import GroupbyHeaderCell from './groupbyHeaderCell';
import * as Action from '../model/actions';
import GridContext from '../grid-context';

import './columnGroupHeader.css';

export default forwardRef(ColumnGrouHeader);

export function ColumnGrouHeader({
    columnGroup,
    colGroupHeaderRenderer,
    colHeaderRenderer,
    model,
    onColumnMove,
    onHeaderClick

},ref) {

    const {dispatch, showContextMenu} = useContext(GridContext);
    const containerEl = useRef(null);

    useImperativeHandle(ref, () => ({
        scrollLeft: scrollLeft => {
                containerEl.current.scrollLeft = scrollLeft;
        }
      }))

    const handleColumnResize = useCallback((phase, column, width) => {
        if (phase === 'resize') {
            if (column.isHeading) {
                dispatch({ type: Action.RESIZE_HEADING, column, width });
            } else {
                // TODO do we need to consider scrolling ?
                dispatch({ type: Action.COLUMN_RESIZE, column, width });
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

    const handleHeaderCellClick = column => {
        let result = true;
        if (onHeaderClick) {
            result = onHeaderClick(column);
        }
        if (result !== false && column.sortable !== false) {
            // this will transform the columns which will cause whole grid to re-render down to cell level. All
            // we really need if for headers to rerender. SHould we store sort criteria outside of columns ?
            dispatch({ type: Action.SORT, column });
        }
    }

    const handleToggleGroupState = useCallback((column, expanded) => {
        const groupState = expanded === 1
            ? { '*': true }
            : {};
        dispatch({ type: Action.TOGGLE, groupState })
    },[]);

    const handleToggleCollapseColumn = useCallback(column => {
        const action = column.collapsed ? Action.COLUMN_EXPAND : Action.COLUMN_COLLAPSE;
        dispatch({ type: action, column });
    }, [])

    const renderColHeadings = heading =>
        heading.map((item, idx) =>
            <HeaderCell
                key={idx} className={cx('colgroup-header', { bottomless: item.label === '' })}
                column={item}
                onResize={handleColumnResize}
                onMove={onColumnMove}
                onToggleCollapse={handleToggleCollapseColumn}
            />
        )

    const renderHeaderCells = () => {

        return columnGroup.columns.filter(column => !column.hidden).map(column => {

            const props = {
                key: column.key,
                column,
                onResize: handleColumnResize,
                onMove: onColumnMove,
                onContextMenu: showContextMenu
            };

            const multiColumnSort = model.sortBy && model.sortBy.length > 1;

            if (column.isGroup) {

                return renderGroupHeader({
                    ...props,
                    groupState: model.groupState,
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
        });
    }

    const renderGroupHeader = (props) => {

        const renderer = colGroupHeaderRenderer;

        return React.isValidElement(renderer)
            ? React.cloneElement(renderer, props)
            : ((renderer && renderer(props)) || <GroupbyHeaderCell {...props} />);

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

    const { width, renderWidth, renderLeft, headings = [] } = columnGroup;

    return (
        <div ref={containerEl} className='GroupHeader' style={{ height: '100%', width: renderWidth, left: renderLeft }}>

            {headings.map((heading, idx) =>
                <div className='group-heading' key={idx} style={{ width }}>
                    {renderColHeadings(heading)}
                </div>
            ).reverse()}

            <div style={{ whiteSpace: 'nowrap', height: '100%', width, position: 'relative' }}>
                {renderHeaderCells()}
            </div>
        </div>
    );
}
