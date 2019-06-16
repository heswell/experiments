
// TODO calculate width, height if not specified
/*global requestAnimationFrame cancelAnimationFrame */
import React, { useRef, useState, useReducer, useEffect, useCallback } from 'react';
import cx from 'classnames';
import * as Action from './model/actions';
import { Motion, spring } from 'react-motion';
// import { useAnimate } from 'react-simple-animate'
import modelReducer, { initModel } from './model/modelReducer';
import Header from './header/header';
import InlineFilter from './header/inlineFilter';
import { Viewport } from './core/viewport';
import { getScrollbarSize } from './utils/domUtils';
import { columnUtils } from '../data';
import GridContext from './grid-context';
import gridReducer from './grid-reducer';
import {useContextMenu} from './use-context-menu';

import { createLogger, logColor } from '../remote-data/constants';

import './grid.css';

const logger = createLogger('Grid', logColor.green)

const scrollbarSize = getScrollbarSize();
//TODO 
// 1) how do we assign extra horizontal space

export default function Grid({
    dataView,
    columns,
    style,
    showHeaders = true,
    headerHeight = showHeaders ? 24 : 0,
    showFilters:initialShowFilters = false,
    onScroll,
    // TODO capture these as callbackProps
    onSelectCell=() => {},
    onSingleSelect,
    onSelectionChange,
    onDoubleClick,
    //TODO be explicit, what can we have here - which of these make sense as grid props ?
    ...props
    // width
    // height
    // rowHeight
    // minColumnWidth
    // groupColumnWidth
    // sortBy
    // groupBy
    // range
    // groupState
    // filter
    // collapsedColumns
    // selectionModel
}) {
    const header = useRef(null);
    const inlineFilter = useRef(null);
    const scrollLeft = useRef(0);
    const overTheLine = useRef(0);
    const inputWidth = props.width || style.width; 
    const inputHeight = props.height || style.height; 

    const [showFilters, setShowFilters] = useState(initialShowFilters);
    const [filter, setFilter] = useState(null);

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
        dataView.select(idx, row, rangeSelect,keepExistingSelection);
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
        columns: columns.map(columnUtils.toKeyedColumn),
        columnMap: columnUtils.buildColumnMap(columns),
        scrollbarSize,
        headerHeight
    }, initModel);

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

    const filterHeight = showFilters ? 24 : 0;
    const headingHeight = showHeaders ? headerHeight * _headingDepth : 0;
    const totalHeaderHeight = headingHeight + filterHeight;
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
        <GridContext.Provider value={{dispatch, callbackPropsDispatch, showContextMenu}}>
            <div style={{ position: 'relative', height, width, ...style }} className={className}>
                {showHeaders && headerHeight !== 0 &&
                    <Header ref={header}
                        height={headingHeight}
                        model={model}
                        colHeaderRenderer={props.colHeaderRenderer}
                    />}

                {showFilters &&
                    <InlineFilter ref={inlineFilter}
                        dataView={dataView}
                        model={model}
                        filter={filter}
                        height={filterHeight}
                        style={{ position: 'absolute', top: headingHeight, height: filterHeight, width }} />}

                <Motion defaultStyle={{ top: headingHeight }} style={{ top: spring(totalHeaderHeight) }}>
                    {interpolatingStyle =>
                        <Viewport
                            dataView={dataView}
                            model={model}
                            style={interpolatingStyle}
                            height={height - totalHeaderHeight}
                            onFilterChange={setFilter}
                        />}
                </Motion>
                {emptyDisplay}
            </div>
        </GridContext.Provider>
    );
}