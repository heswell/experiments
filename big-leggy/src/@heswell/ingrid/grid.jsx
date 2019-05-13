
// TODO calculate width, height if not specified
/*global requestAnimationFrame cancelAnimationFrame */
import React, { useRef, useState, useReducer, useEffect, useCallback } from 'react';
import cx from 'classnames';
import * as Action from './model/actions';
import { Motion, spring } from 'react-motion';
import modelReducer, { initModel } from './model/modelReducer';
import Header from './header/header';
import InlineFilter from './header/inlineFilter';
import { Viewport } from './core/viewport';
import { getScrollbarSize } from './utils/domUtils';
import { PopupService } from './services';
import GridContextMenu from './contextMenu';
import { columnUtils } from '../data';
import {GridDispatch} from './grid-context';

import { createLogger, logColor } from '../remote-data/constants';

import './grid.css';

const logger = createLogger('Grid', logColor.green)

const scrollbarSize = getScrollbarSize();

const callbackPropReducer = (
    onScroll,
    onSingleSelect,
    onSelectionChange,
    onSelectCell

) => (state, action) => {
    const { type, ...props } = action;
    if (type === 'scroll') {
        onScroll && onScroll(props);
    } else if (type === 'selection') {
        const { selected, idx, selectedItem } = action;
        onSelectionChange && onSelectionChange(selected, idx);
        if (selected.length === 1 && onSingleSelect) {
            onSingleSelect(selected[0], selectedItem);
        }
    } else if (type === 'select-cell') {
        const { idx: rowIdx, cellIdx } = action;
        onSelectCell && onSelectCell(rowIdx, cellIdx);
    }

    return state;
}

export default function Grid({
    dataView,
    columns,
    style,
    showHeaders = true,
    headerHeight = showHeaders ? 24 : 0,
    selected = [],
    showFilters = false,
    onScroll,
    onSelectCell=() => {},
    onSingleSelect,
    onSelectionChange,
    //TODO be explicit, what can we have here
    ...props
}) {


    const header = useRef(null);
    const inlineFilter = useRef(null);
    const scrollLeft = useRef(0);
    const overTheLine = useRef(0);

    const [state, setState] = useState({
        showFilters,
        showFilter: null
    });

    const handleScroll = params => {
        const { scrollLeft: pos = -1 } = params;
        if (pos !== -1) {
            if (scrollLeft.current !== pos) {
                scrollLeft.current = pos;
                if (header.current) {
                    header.current.setScrollLeft(pos);
                }
                if (inlineFilter.current) {
                    inlineFilter.current.setScrollLeft(pos);
                }
            }
        }
        onScroll && onScroll(params);
    }

    const [, callbackPropsDispatch] = useReducer(callbackPropReducer(
        handleScroll,
        onSingleSelect,
        onSelectionChange,
        onSelectCell
    ), null);

    const [model, dispatch] = useReducer(modelReducer, {
        //TODO which props exactly does the model still use ?
        ...props,
        columns: columns.map(columnUtils.toKeyedColumn),
        columnMap: columnUtils.buildColumnMap(columns),
        scrollbarSize,
        headerHeight
    }, initModel);

    const {
        height,
        width,
        _headingDepth,
        groupBy,
        groupState,
        sortBy,
        range,
        _overTheLine } = model;

    useEffect(() => {
        overTheLine.current = _overTheLine;
        logger.log(`<useEffect _overTheLine>`);
        // we want to keep dispatching scroll as long as the column is over the line
        const scroll = () => {
            if (overTheLine.current !== 0) {
                const type = overTheLine.current > 0 ? Action.SCROLL_RIGHT : Action.SCROLL_LEFT;
                const scrollDistance = type === Action.SCROLL_RIGHT ? 3 : -3;
                dispatch({ type, scrollDistance });
                requestAnimationFrame(scroll);
            }
        };
        scroll();

    }, [_overTheLine])

    useEffect(() => {
        if (sortBy !== undefined) {
            dataView.sort(sortBy);
        }
    }, [dataView, sortBy]);

    useEffect(() => {
        if (groupBy !== undefined) {
            dataView.group(groupBy);
        }
    }, [dataView, groupBy])

    useEffect(() => {
        if (groupState !== undefined) {
            dataView.setGroupState(groupState);
        }
    }, [dataView, groupState]);

    useEffect(() => {
        if (range !== undefined) {
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
        // we can roll context menu into the context once more of the child components are functions
        <GridDispatch.Provider value={{dispatch, callbackPropsDispatch}}>
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
                            dataView={dataView}
                            model={model}
                            // selectedRows={data.selected}
                            style={interpolatingStyle}
                            height={height - totalHeaderHeight}
                            onCellClick={onSelectCell}
                            onContextMenu={showContextMenu}
                        />}
                </Motion>
                {emptyDisplay}
            </div>
        </GridDispatch.Provider>
    );
}