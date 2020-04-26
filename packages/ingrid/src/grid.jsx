/**
 * @typedef {import('./grid').GridComponent} Grid
 * 
 * TODO calculate width, height if not specified
 * global requestAnimationFrame cancelAnimationFrame 
 */
import React, { useRef, useState, useReducer, useEffect, useCallback } from 'react';
import cx from 'classnames';
import { createLogger, logColor } from '@heswell/utils';
import * as Action from './model/actions';
import modelReducer, { initModel } from './model/model-reducer';
import InlineFilter from './header/inline-filter/inline-filter.jsx';
import SelectHeader from './header/select-header/select-header.jsx';
import ColumnGroupHeader from './header/column-group-header.jsx';
import Viewport from './core/viewport.jsx';
import { getScrollbarSize } from './utils/domUtils';
import GridContext from './grid-context';
import gridReducer from './grid-reducer';
import {useContextMenu} from './context-menu/use-context-menu.jsx';

import './grid.css';

const logger = createLogger('Grid', logColor.green)

const scrollbarSize = getScrollbarSize();
//TODO 
// 1) how do we assign extra horizontal space

const defaultHeaders = {
    showColumnHeader: true,
    showSelectHeader: false,
    showInlineFilter: false
} 

/** @type {Grid} */
const Grid = ({
    dataSource,
    columns=[],
    style,
    showHeaders = defaultHeaders,
    headerHeight = showHeaders ? 24 : 0,
    rowStripes=false,
    onScroll,
    // TODO capture these as callbackProps
    onSelectCell=() => {},
    onSingleSelect,
    onSelectionChange,
    onDoubleClick,
    ...props
}) => {

    const {
        showColumnHeader = defaultHeaders.showColumnHeader,
        showSelectHeader = defaultHeaders.showSelectHeader,
        showInlineFilter = defaultHeaders.showInlineFilter
    } = showHeaders;

    const inlineFilter = useRef(null);
    const scrollingHeader = useRef(null);
    const scrollLeft = useRef(0);
    const overTheLine = useRef(0);
    const prevColumns = useRef(null);
    const inputWidth = style.width; 
    const inputHeight = style.height; 

    const [showFilters, setShowFilters] = useState(showInlineFilter);
    const [scrolling, setScrolling] = useState(false);

    // TODO why don't we store this in the model ?
    const [filter, setFilter] = useState(null);

    const handleSelectionChange = useCallback((idx, row, rangeSelect, keepExistingSelection) => {
        dataSource.select(idx, rangeSelect,keepExistingSelection);
        if (onSelectionChange){
            const isSelected = row[model.meta.SELECTED] === 1;
            // TODO what about range selections
            onSelectionChange && onSelectionChange(idx, row, !isSelected)
        }
      // if (selected.length === 1 && onSingleSelect) {
      //     onSingleSelect(selected[0], selectedItem);
      // }

    },[]);

    const handleScrollStart = () => setScrolling(true);

    const handleScrollEnd = (isScrolling, scrollLeft) => {
        setScrolling(false);
        scrollingHeader.current.scrollLeft(scrollLeft);
        console.log(`%cstopped scrolling at ${scrollLeft}`,'color:brown;font-weight:bold;')

    }

    // this reducer is a no=op - always returns same state
    // TODO why not use existing reducer ?
    const [, callbackPropsDispatch] = useReducer(useCallback(gridReducer({
        'double-click': onDoubleClick,
        'selection': handleSelectionChange,
        'select-cell': onSelectCell,
        'scroll-end-horizontal': handleScrollEnd,      
        'scroll-start-horizontal': handleScrollStart        
    }),[]), null);

    const [model, dispatch] = useReducer(modelReducer, {
        //TODO which props exactly does the model still use ?
        ...props,
        columns,
        scrollbarSize,
        width: inputWidth,
        height: inputHeight,
        headerHeight,
        rowStripes
    }, initModel);

    useEffect(() => {
        if (prevColumns.current && prevColumns.current !== columns){
            dispatch({type: Action.COLUMNS_CHANGE, columns});
        }
        prevColumns.current = columns;
    },[columns])

    const showContextMenu = useContextMenu(model, showFilters, setShowFilters, dispatch);

    const {
        height,
        width,
        _headingDepth,
        groupBy,
        groupState,
        sortBy,
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
        dispatch({type: Action.GRID_RESIZE, width: inputWidth, height: inputHeight})
    },[inputWidth, inputHeight])

    useEffect(() => {
        if (sortBy !== undefined) {
            dataSource.sort(sortBy);
        }
    }, [dataSource, sortBy]);

    useEffect(() => {
        if (groupBy !== undefined) {
            dataSource.group(groupBy);
        }
    }, [dataSource, groupBy])

    useEffect(() => {
        if (groupState !== undefined) {
            dataSource.setGroupState(groupState);
        }
    }, [dataSource, groupState]);

    const headerVisible = showColumnHeader && !scrolling;
    const filterVisible = showFilters && !scrolling;

    const filterHeight = filterVisible ? 24 : 0;
    const selectHeaderHeight = showSelectHeader ? 24 : 0; 
    const headingHeight = headerVisible ? headerHeight * _headingDepth : 0;
    const totalHeaderHeight = headingHeight + filterHeight + selectHeaderHeight;
    const isEmpty = dataSource.size <= 0;
    const emptyDisplay = (isEmpty && props.emptyDisplay) || null;
    const className = cx(
        'Grid',
        props.className, {
            'empty': emptyDisplay,
            'no-header' : isEmpty && props.showHeaderWhenEmpty === false,
            'scrolling-x': scrolling
        }
    );
    console.log(`grid className ${className}`)    

    const handleColumnMove = (phase, column, distance) => {
        if (!column.isHeading) {
            const pos = scrollLeft.current;
            if (phase === 'move' && distance !== 0) {
                dispatch({ type: Action.MOVE, distance, scrollLeft: pos });
            } else if (phase === 'begin') {
                dispatch({ type: Action.MOVE_BEGIN, column, scrollLeft: pos });
            } else if (phase === 'end') {
                dispatch({ type: Action.MOVE_END, column });
            }
        }
    }

    // TODO we don't want to build these every time
    function getColumnHeaders(){
        return model._groups.map((group, idx) => {
            return (
                <ColumnGroupHeader
                    key={idx}
                    columnGroup={group}
                    model={model}
                    onColumnMove={handleColumnMove}
                    colHeaderRenderer={props.colHeaderRenderer}
                    ref={group.locked ? null : scrollingHeader}
                    style={{height: headerHeight, width: scrolling ? group.width : group.renderWidth}}
                />
            );
        })
    }
    
    return (
        // we can roll context menu into the context once more of the child components are functions
        <GridContext.Provider value={{dispatch, callbackPropsDispatch, showContextMenu}}>
            <div style={{ position: 'relative', ...style }} className={className}>
                {headerVisible && headerHeight !== 0 &&
                    <div className="Header" style={{height: headingHeight}}>
                        {getColumnHeaders()}
                    </div>
                }

                {filterVisible &&
                    <InlineFilter ref={inlineFilter}
                        dataSource={dataSource}
                        model={model}
                        filter={filter}
                        height={filterHeight}
                        style={{ position: 'absolute', top: headingHeight, height: filterHeight, width }} />}
                {showSelectHeader &&
                <SelectHeader dataView={dataSource} style={{top:headingHeight, height:selectHeaderHeight}}/>}
                <Viewport
                    dataSource={dataSource}
                    height={height - totalHeaderHeight}
                    model={model}
                    onFilterChange={setFilter}
                    // maybe we should call this optimiseLayout, layoutHint ?
                    columnHeaders={scrolling ? getColumnHeaders() : undefined}
                    style={{top: totalHeaderHeight}}
                />
                {emptyDisplay}
            </div>
        </GridContext.Provider>
    );
}

export default Grid;
