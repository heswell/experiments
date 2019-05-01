
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
import { getScrollbarSize } from './utils/domUtils';
import { PopupService } from './services';
import GridContextMenu from './contextMenu';
import { columnUtils } from '../data';

import { createLogger, logColor } from '../remote-data/constants';

import './grid.css';

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


    const header = useRef(null);
    const viewport = useRef(null);
    const inlineFilter = useRef(null);
    const scrollLeft = useRef(0);
    const overTheLine = useRef(0);

    const [state, setState] = useState({
        showFilters,
        showFilter: null
    });

    const [{ model, data }, dispatch] = useReducer(reducer, {
        model: {
            ...props,
            columns: columns.map(columnUtils.toKeyedColumn),
            columnMap: columnUtils.buildColumnMap(columns),
            scrollbarSize,
            headerHeight
        },
        data: {
            rows: [],
            rowCount: 0,
            selected
        }
    }, init);

    const { 
        height,
        width,
        _headingDepth,
        groupBy,
        groupState,
        sortBy,
        range,
        _overTheLine,
        scrollLeft: columnScroll } = model;

    useEffect(() => {
        logger.log('<call dataView.subscribe>')
        // dataView.subscribe(columns, (msgType, rows, rowCount = null) => {
        //     dispatch({ type: 'data', rows, rowCount })
        // });
        dataView.subscribe({
            columns
        }, (rows, rowCount) => {
            dispatch({ type: 'data', rows, rowCount })
        })
        // TODO how do we manage this 
        //dataView.setRange(0, 25, false);
    }, [dataView]);

    useEffect(() => {
        overTheLine.current = _overTheLine;
        // we want to keep dispatching scroll as long as the column is over the line
        const scroll = () => {
            if (overTheLine.current !== 0){
                const type = overTheLine.current > 0 ? Action.SCROLL_RIGHT : Action.SCROLL_LEFT;
                const scrollDistance = type === Action.SCROLL_RIGHT ? 3 : -3;
                dispatch({ type, scrollDistance });  
                requestAnimationFrame(scroll);
            }
        };
        scroll();
        
    },[_overTheLine])

    useEffect(() => {
        if (columnScroll !== 0){
            viewport.current.scrollTo(columnScroll);
        }
    },[columnScroll])

    useEffect(() => {
        if (sortBy !== undefined){
            dataView.sort(sortBy);
            viewport.current.setScroll(0);
        }
    }, [dataView, sortBy]);

    useEffect(() => {
        if (groupBy !== undefined){
            dataView.group(groupBy);
            viewport.current.setScroll(0, 0);
        }
    }, [dataView, groupBy])

    useEffect(() => {
        if (groupState !== undefined){
            dataView.setGroupState(groupState);
            viewport.current.setScroll(0);
        }
    }, [dataView, groupState]);

    useEffect(() => {
        if (range !== undefined){
            dataView.setRange(range.lo, range.hi);
        }
    }, [dataView, range]);

    const filterHeight = state.showFilters ? 24 : 0;
    const headingHeight = showHeaders ? headerHeight * _headingDepth : 0;
    const totalHeaderHeight = headingHeight + filterHeight;

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

    const handleContextMenuAction = useCallback(action => {

        if (action === 'show-filters') {
            setState({
                ...state,
                showFilters: state.showFilters === false
            });
        } else if (action === 'hide-filters') {
            this.props.dispatch({ type: 'SAVE_CONFIG', config: { showFilters: false } });
        }

    }, []);

    const handleToggleCollapseColumn = useCallback(column => {
        const action = column.collapsed ? Action.COLUMN_EXPAND : Action.COLUMN_COLLAPSE;
        dispatch({ type: action, column });
    }, [dispatch])


    // do we need to call a prop for this ?
    const handleVerticalScroll = useCallback(scrollTop => {
        onScroll && onScroll({ scrollTop });
    }, [])

    const handleHorizontalScroll = useCallback(pos => {
        if (scrollLeft.current !== pos) {
            scrollLeft.current = pos;
            if (header.current) {
                header.current.setScrollLeft(pos);
            }
            if (inlineFilter.current) {
                inlineFilter.current.setScrollLeft(pos);
            }
            }

        onScroll && onScroll({ scrollLeft: pos });
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

    const handleFilterClose = useCallback((/*column*/) => {
        setState(state => ({ 
            ...state,
            showFilter: null 
        }));
        // I think we're doing this so that if same filter is opened again, dataView sends rows
        dataView.setFilterRange(0, 0);
    }, [dataView])

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
                    dispatch={dispatch}
                    gridModel={model}
                    onToggleCollapse={handleToggleCollapseColumn}
                    onHeaderClick={props.onHeaderClick}
                    colHeaderRenderer={props.colHeaderRenderer}
                    onContextMenu={showContextMenu} />}

            {state.showFilters &&
                <InlineFilter ref={inlineFilter}
                    dispatch={dispatch}
                    dataView={dataView}
                    gridModel={model}
                    onFilterOpen={handleFilterOpen}
                    onFilterClose={handleFilterClose}
                    showFilter={state.showFilter}
                    height={filterHeight}
                    style={{ position: 'absolute', top: headerHeight, height: filterHeight, width }} />}

            <Motion defaultStyle={{ top: headingHeight }} style={{ top: spring(totalHeaderHeight) }}>
                {interpolatingStyle =>
                    <Viewport
                        ref={viewport}
                        dispatch={dispatch}
                        gridModel={model}
                        rows={data.rows}
                        selectedRows={data.selected}
                        selectionDefault={selectionDefault}
                        style={interpolatingStyle}
                        height={height - totalHeaderHeight}
                        width={model.width}
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

    // componentWillReceiveProps(nextProps) {

    //     const {width, height} = nextProps;
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