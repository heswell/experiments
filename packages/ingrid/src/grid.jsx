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
import Header from './header/header.jsx';
import InlineFilter from './header/inline-filter/inline-filter.jsx';
import SelectHeader from './header/select-header/select-header.jsx';
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

    const header = useRef(null);
    const inlineFilter = useRef(null);
    const scrollLeft = useRef(0);
    const overTheLine = useRef(0);
    const prevColumns = useRef(null);
    const inputWidth = style.width; 
    const inputHeight = style.height; 

    const [showFilters, setShowFilters] = useState(showInlineFilter);

    // TODO why don't we store this in the model ?
    const [filter, setFilter] = useState(null);

    // Used to sync headers with horizontal scrolling canvas. Implemented via 
    // direct callback for speed - model.scrollLeft is too slow
    const handleScroll = useCallback(params => {
        const { scrollLeft: pos = -1 } = params;
        if (pos !== -1) {
            if (scrollLeft.current !== pos) {
                scrollLeft.current = pos;
                if (header.current) {
                    header.current.scrollLeft(pos);
                }
                if (inlineFilter.current) {
                    inlineFilter.current.scrollLeft(pos);
                }
            }
        }
        onScroll && onScroll(params);
    },[]);

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

    },[])

    // this reducer is a no=op - always returns same state
    // TODO why not use existing reducer ?
    const [, callbackPropsDispatch] = useReducer(useCallback(gridReducer(
        handleScroll,
        handleSelectionChange,
        onSelectCell,
        onDoubleClick
    ),[]), null);

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

    const filterHeight = showFilters ? 24 : 0;
    const selectHeaderHeight = showSelectHeader ? 24 : 0; 
    const headingHeight = showColumnHeader ? headerHeight * _headingDepth : 0;
    const totalHeaderHeight = headingHeight + filterHeight + selectHeaderHeight;
    const isEmpty = dataSource.size <= 0;
    const emptyDisplay = (isEmpty && props.emptyDisplay) || null;
    const className = cx(
        'Grid',
        props.className,
        emptyDisplay ? 'empty' : '',
        isEmpty && props.showHeaderWhenEmpty === false ? 'no-header' : ''
    );

    return (
        // we can roll context menu into the context once more of the child components are functions
        <GridContext.Provider value={{dispatch, callbackPropsDispatch, showContextMenu}}>
            <div style={{ position: 'relative', ...style }} className={className}>
                {showColumnHeader && headerHeight !== 0 &&
                    <Header ref={header}
                        height={headingHeight}
                        model={model}
                        colHeaderRenderer={props.colHeaderRenderer}
                    />}

                {showFilters &&
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
                    model={model}
                    style={{top: totalHeaderHeight}}
                    height={height - totalHeaderHeight}
                    onFilterChange={setFilter}
                />
                {emptyDisplay}
            </div>
        </GridContext.Provider>
    );
}

export default Grid;