/*
    why is _scrollLeft set to undefined in both willMount and willUnmount

*/

// TODO calculate width, height if not specified
/*global requestAnimationFrame cancelAnimationFrame */
import React, { useRef, useState, useReducer, useEffect, useCallback } from 'react';
import cx from 'classnames';
import * as Action from './model/actions';
import { Motion, spring } from 'react-motion';
import reducer, { init } from './model/gridReducer';
import Header from './header/header';
import ColumnBearer from './core/ColumnBearer';
import InlineFilter from './header/inlineFilter';
import Viewport from './core/viewport';
import { getScrollbarSize, getColumnWidth } from './utils/domUtils';
import { PopupService } from './services';
import GridContextMenu, { ContextMenuActions } from './contextMenu';
import { DataTypes, filter as filterUtils, groupHelpers, columnUtils, ASC } from '../data';

import { createLogger, logColor } from '../remote-data/constants';

import './grid.css';

// static defaultProps = {
//     rowHeight: 23,
//     minColumnWidth: 80,
// };

const logger = createLogger('Grid', logColor.green)

const scrollbarSize = getScrollbarSize();

export default function Grid({
    dataView,
    columns,
    style,
    showHeaders = true,
    headerHeight = showHeaders ? 24 : 0,
    selectionDefault,
    selected = [],
    showFilters = false,
    onScroll,
    onSelectCell,
    onSingleSelect,
    onSelectionChange,
    //TODO are any of the above needed by model in props ?
    ...props }) {

    const { columnMap } = dataView;

    const header = useRef(null);
    const viewport = useRef(null);
    const inlineFilter = useRef(null);

    const [state, setState] = useState({
        showFilters,
        showFilter: null

    });

    // both should go in a ref
    let _scrollLeft = undefined;
    let _scrollTimer = null;

    const [{ model, data }, dispatch] = useReducer(reducer, {
        model: {
            ...props,
            columns: columns.map(columnUtils.toKeyedColumn),
            columnMap,
            scrollbarSize,
            headerHeight
        },
        data: {
            rows: [],
            rowCount: 0,
            selected
        }
    }, init);

    const { height, width, _headingDepth, groupBy, extendsPrevGroupBy, sortBy } = model;
    logger.log(`groupBy from model ${groupBy}`)

    useEffect(() => {
        logger.log('<call dataView.subscribe>')
        dataView.subscribe(columns, (msgType, rows, rowCount = null) => {
            // maybe we should be setting rows and length in state
            logger.log(`<${msgType}> rowCount=${rowCount}`);
            // const {IDX, SELECTED} = model.meta;
            dispatch({ type: 'data', rows, rowCount })

            // NO set group header width within model
            // if (this.state.groupToggled && rowCount !== 0){
            //     // is this necessary every time ?
            //     const [group] = model._groups;
            //     const [column] = group.columns;
            //     const width = getColumnWidth(column);
            //     dispatch({ type: Action.GROUP_COLUMN_WIDTH, column, width });
            //     state.groupToggled = false;
            // }

        });

        // TODO how do we manage this 
        dataView.setRange(0, 25, false);

    }, [dataView]);

    useEffect(() => dataView.sort(sortBy), [dataView, sortBy])
    useEffect(() => {
        console.log(`groupBy changes to ${JSON.stringify(groupBy)} extendsPrevGroupBy=${extendsPrevGroupBy}`);
        dataView.groupBy(groupBy, extendsPrevGroupBy);
        viewport.current.setScroll(0, 0);
    }, [dataView, groupBy])


    const filterHeight = state.showFilters ? 24 : 0;
    const headingHeight = showHeaders ? headerHeight * _headingDepth : 0;
    const totalHeaderHeight = headingHeight + filterHeight;

    const sort = useCallback((column, direction = null, preserveExistingSort = false) => {
        // this will transform the columns which will cause whole grid to re-render down to cell level. All
        // we really need if for headers to rerender. SHould we store sort criteria outside of columns ?
        dispatch({ type: Action.SORT, column, direction, preserveExistingSort });
        viewport.current.setScroll(0);
    }, [dispatch])

    const unGroupBy = useCallback(column => {
        dispatch({ type: Action.groupExtend, column });
    }, [dispatch])

    const sortGroup = useCallback(column => {
        dispatch({ type: Action.SORT_GROUP, column });
    }, [dispatch]);

    const toggleGroup = useCallback(groupRow => {
        const groupState = groupHelpers.toggleGroupState(groupRow, model);
        dataView.setGroupState(groupState);
        dispatch({ type: Action.TOGGLE, groupState });
    }, [model, dispatch])

    const setViewRange = useCallback((firstVisibleRow, lastVisibleRow, initialRange = false) => {
        const sendDelta = initialRange === false;
        dataView.setRange(firstVisibleRow, lastVisibleRow, sendDelta);
    }, [dataView])

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
    }, [dispatch])

    //TODO if we can pass the required data back with the request, we won't need to embed this callback
    const showContextMenu = useCallback((e, location, options) => {

        e.preventDefault();
        e.stopPropagation();

        const { clientX: left, clientY: top } = e;
        const component = (
            <GridContextMenu component={this}
                location={location}
                options={{
                    ...options,
                    model,
                    showFilters: state.showFilters
                }}
                dispatch={dispatch}
                doAction={handleContextMenuAction} />)
            ;

        PopupService.showPopup({ left: Math.round(left), top: Math.round(top), component });

    }, [model, props])

    const handleContextMenuAction = useCallback((action, { column } = {}) => {
        switch (action) {
            case ContextMenuActions.SortAscending: return sort(column, 'asc');
            case ContextMenuActions.SortDescending: return sort(column, 'dsc');
            case ContextMenuActions.SortAddAscending: return sort(column, 'asc', true);
            case ContextMenuActions.SortAddDescending: return sort(column, 'dsc', true);
            default:

        }

        if (action === 'groupby-remove') {
            this.groupBy(data.column);
        } else if (action === 'show-filters') {
            setState({
                ...state,
                showFilters: state.showFilters === false
            });
        } else if (action === 'hide-filters') {
            this.props.dispatch({ type: 'SAVE_CONFIG', config: { showFilters: false } });
        }

    }, [sort]);

    const handleColumnMoveBegin = useCallback((column) => {
        if (column.isHeading) {
            console.log(`col  heading move begin`);
        } else {
            dispatch({ type: Action.MOVE_BEGIN, column, scrollLeft: _scrollLeft });
        }
    }, [dispatch]);

    const handleColumnMove = useCallback((phase, column, distance) => {
        if (phase === 'move' && distance !== 0) {

            //TODO refs needed
            if (_scrollTimer !== null) {
                cancelAnimationFrame(_scrollTimer);
                _scrollTimer = null;
            }

            dispatch({ type: Action.MOVE, distance, scrollLeft: _scrollLeft });
            // handle the scenario where we have horizontal scrolling to deal with
            // if (model._overTheLine) {
            //     const scroll = () => {
            //         const type = model._overTheLine > 0 ? Action.SCROLL_RIGHT : Action.SCROLL_LEFT;
            //         const scrollDistance = type === Action.SCROLL_RIGHT ? 3 : -3;
            //         const { scrollLeft } = this.reducer.state;
            //         model = this.reducer.dispatch({ type, scrollDistance });
            //         if (model.scrollLeft !== scrollLeft) {
            //             this.viewport.current.scrollTo(model.scrollLeft);
            //             this._scrollTimer = requestAnimationFrame(scroll);
            //             this.setState({ model });
            //         }
            //     };

            //     _scrollTimer = requestAnimationFrame(scroll);
            // }

        } else if (phase === 'begin') {
            handleColumnMoveBegin(column);
        } else if (phase === 'end') {
            handleColumnMoveEnd(column);
        }
    }, [dispatch]);

    const handleColumnMoveEnd = useCallback(column => {
        if (column.isHeading) {
            console.log(`col heading move end`);
        } else {
            dispatch({ type: Action.MOVE_END, column });
        }
    }, [dispatch]);

    const toggleGroupAll = useCallback((column, expanded) => {
        console.log(`toggleGroupAll ${column.name}`)
        const groupState = expanded === 1
            ? { '*': true }
            : {};
        dataView.setGroupState(groupState);
        dispatch({ type: Action.TOGGLE, groupState })
    }, [dataView, dispatch])

    const handleToggleCollapseColumn = useCallback(column => {
        const action = column.collapsed ? Action.COLUMN_EXPAND : Action.COLUMN_COLLAPSE;
        dispatch({ type: action, column });
    }, [dispatch])


    // do we need to call a prop for this ?
    const handleVerticalScroll = useCallback(scrollTop => {
        onScroll && onScroll({ scrollTop });
    }, [])

    const handleHorizontalScroll = useCallback(scrollLeft => {
        if (_scrollLeft !== scrollLeft) {
            _scrollLeft = scrollLeft;
            onHorizontalScroll();
        }

        onScroll && onScroll({ scrollLeft });
    }, []);

    // useEffect
    const onHorizontalScroll = useCallback(() => {
        const scrollLeft = _scrollLeft;
        if (header.current) {
            header.current.setScrollLeft(scrollLeft);
        }
        if (inlineFilter.current) {
            inlineFilter.current.setScrollLeft(scrollLeft);
        }
    }, []);

    const handleSelectionChange = useCallback((selected, idx, selectedItem) => {
        // selection needs to be sent to server
        onSelectionChange && onSelectionChange(selected, idx);
        if (selected.length === 1 && onSingleSelect) {
            idx = selected[0];
            onSingleSelect(idx, selectedItem);
        }
    }, [])

    const handleCellClick = useCallback(selectedCell => {
        onSelectCell && onSelectCell(selectedCell);
    }, [])

    const handleFilterOpen = useCallback(column => {
        if (state.showFilter !== column.name) {
            // we could call dataView here to trigger build of filter data
            // this could be moved down to serverApi
            const { key, name } = column.isGroup ? column.columns[0] : column;

            dataView.getFilterData({
                key, name
            });

            setTimeout(() => {
                setState({
                    ...state,
                    showFilter: column.name
                });
            }, 50)
        }
    }, [dataView, state])

    const handleFilter = useCallback((column, newFilter) => {
        const filter = filterUtils.addFilter(model.filter, newFilter);
        console.log(`
                add filter ${JSON.stringify(newFilter, null, 2)}
                to filter ${JSON.stringify(model.filter, null, 2)}
                creates new filter = ${JSON.stringify(filter, null, 2)}
            `)

        dataView.filter(filter);
        dispatch({ type: Action.FILTER, column, filter });

        if (newFilter.isNumeric) {
            // re-request the filterData, this will re-create bins on the filtered data
            const { key, name } = column.isGroup ? column.columns[0] : column;
            dataView.getFilterData({ key, name });
        }
    }, [model]);

    const handleClearFilter = useCallback(column => {
        const filter = filterUtils.removeFilterForColumn(model.filter, column);
        dataView.filter(filter);
        dispatch({ type: Action.FILTER, column, filter })
    }, [dispatch])

    const handleFilterClose = useCallback((/*column*/) => {
        setState({ showFilter: null });
        dataView.setRange(0, 0, false, DataTypes.FILTER_DATA);
    }, [dataView])

    const handleSearchText = useCallback(({ key, name }, text) => {
        dataView.getFilterData({ key, name }, text);
    }, [dataView])

    // // This is being used to handle selection in a set filter, need to consider how it will work
    // // with regular row selection
    const handleSelection = (dataType, colName, filterMode) => {
        dataView.select(dataType, colName, filterMode);
    }

    const isEmpty = dataView.size <= 0;
    const emptyDisplay = (isEmpty && props.emptyDisplay) || null;
    const className = cx(
        'Grid',
        props.className,
        emptyDisplay ? 'empty' : '',
        isEmpty && props.showHeaderWhenEmpty === false ? 'no-header' : ''
    );

    return (
        <div style={{ ...style, position: 'relative', height, width }} className={className}>
            {showHeaders && headerHeight !== 0 &&
                <Header ref={header}
                    height={headingHeight}
                    gridModel={model}
                    onColumnResize={handleColumnResize}
                    onColumnMove={handleColumnMove}
                    onToggleCollapse={handleToggleCollapseColumn}
                    onToggleGroupState={toggleGroupAll}
                    onSort={sort}
                    onSortGroup={sortGroup}
                    onRemoveGroupbyColumn={unGroupBy}
                    onHeaderClick={props.onHeaderClick}
                    colHeaderRenderer={props.colHeaderRenderer}
                    onContextMenu={showContextMenu} />}

            {state.showFilters &&
                <InlineFilter ref={inlineFilter}
                    onFilter={handleFilter}
                    onSelect={handleSelection}
                    onClearFilter={handleClearFilter}
                    onFilterOpen={handleFilterOpen}
                    onFilterClose={handleFilterClose}
                    onSearchText={handleSearchText}
                    showFilter={state.showFilter}
                    dataView={dataView}
                    gridModel={model}
                    height={filterHeight}
                    style={{ position: 'absolute', top: headerHeight, height: filterHeight, width }} />}

            <Motion defaultStyle={{ top: headingHeight }} style={{ top: spring(totalHeaderHeight) }}>
                {interpolatingStyle =>
                    <Viewport
                        ref={viewport}
                        rows={data.rows}
                        selectedRows={data.selected}
                        selectionDefault={selectionDefault}
                        style={interpolatingStyle}
                        height={height - totalHeaderHeight}
                        width={model.width}
                        gridModel={model}
                        onToggleGroup={toggleGroup}
                        onSetRange={setViewRange}
                        onVerticalScroll={handleVerticalScroll}
                        onHorizontalScroll={handleHorizontalScroll}
                        onSelectionChange={handleSelectionChange}
                        onCellClick={handleCellClick}
                        onContextMenu={showContextMenu}
                    />}
            </Motion>
            {emptyDisplay}

            {model._movingColumn &&
                <ColumnBearer gridModel={model} rows={data.rows} />}

        </div>
    );

    // componentWillMount() {
    //     this._scrollLeft = undefined;
    // }

    // componentWillUnmount() {
    //     this._scrollLeft = undefined;
    //     this.state.dataView.unsubscribe();        

    //     // don't destroy a  Data View that we don't sown
    //     if (!this.props.dataView){
    //         this.state.dataView.destroy();
    //     }

    // }

    // componentDidMount() {
    //     this.onHorizontalScroll();
    // }

    // componentDidUpdate() {
    //     this.onHorizontalScroll();
    // }

    // componentWillReceiveProps(nextProps) {

    //     const {data, dataView, defaultSelected, selected, width, height} = nextProps;
    //     if (data !== this.props.data) {
    //         const [rows, rowCount] = this.state.dataView.setData(data);
    //         this.setState({
    //             model: this.reducer.dispatch({ type: Action.ROWCOUNT, rowCount }),
    //             rows
    //         });
    //     } else if (dataView !== this.props.dataView){
    //         this.props.dataView.removeListener(DataTypes.ROW_DATA, this.onRowset);
    //         dataView.on(DataTypes.ROW_DATA, this.onRowset);
    //         const {height, rowHeight} = this.state.model;
    //         const visibleRows = Math.ceil(height / rowHeight); // not accurate, we should store this
    //         dataView.setRange(0, visibleRows, false);
    //         this.setState({ dataView });
    //     }

    //     if (selected !== this.props.selected || defaultSelected !== this.props.defaultSelected){
    //         this.setState({
    //             selected: defaultSelected || selected
    //         });
    //     }

    //     // we only actually need to reset the model when height or length
    //     // changes if vertical scroll state is affected - if we go from
    //     // vertical scrollbar showing to no vertical scrollbar or vice versa.

    //     if (this.props.width !== width || this.props.height !== nextProps.height){
    //     //     this.props.height !== nextProps.height ||
    //     //     this.props.columns !== nextProps.columns ||
    //     //     model.sortCriteria !== dataView.sortCriteria ||
    //     //     model.groupBy !== dataView.groupBy ||
    //     //     this.props.groupColumnWidth !== nextProps.groupColumnWidth) {

    //     //     const {columns, minColumnWidth, groupColumnWidth} = nextProps;
    //     //     const {sortCriteria, groupBy} = dataView;
    //     //     // careful, columns depends on groupBy
    //         this.setState({
    //             model: this.reducer.dispatch({ type: Action.GRID_RESIZE, width, height })
    //         });
    //     }

    // }
}