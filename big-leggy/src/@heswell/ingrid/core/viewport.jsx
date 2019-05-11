import React, { useState, useCallback, useRef, useEffect, useReducer } from 'react';
import Canvas from './canvas';
import ColumnBearer from '../core/ColumnBearer';
import css from '../style/grid';
import SelectionModel from '../model/selectionModel';
import * as Action from '../model/actions';
import dataReducer from '..//model/dataReducer';
import { getScrollbarSize } from '../utils/domUtils';
import { groupHelpers } from '../../data';

const scrollbarSize = getScrollbarSize();

export const Viewport = React.memo(({
    style,
    height,
    dispatch,
    callbackPropsDispatch,
    dataView,
    gridModel: model,
    selectedRows,
    onCellClick, // will go when we pass callbackPropsDispatch down
    onContextMenu
}) =>  {

    const scrollingCanvas = useRef(null);
    const scrollableContainerEl = useRef(null);
    const verticalScrollContainer = useRef(null);
    const scrollTop = useRef(0);
    const firstVisibleRow = useRef(0);
    const groupBy = useRef(model.groupBy);

    const [selectionState, setSelectionState] = useState(SelectionModel.getInitialState(selectedRows));

    const selIdx = selectionState.focusedIdx;
    console.log(`selIdx = ${selIdx}`)

    const [data, dispatchData] = useReducer(dataReducer(model), {
            rows: [],
            rowCount: 0,
            selected: []
    });

    useEffect(() => {

        const rowCount = Math.ceil(height / model.rowHeight) + 1

        dataView.subscribe({
            columns: model.columns,
            range: { lo: 0, hi: rowCount }
        }, (rows, rowCount) => {
            if (rowCount !== model.rowCount){
                dispatch({type: Action.ROWCOUNT, rowCount})
            }
            dispatchData({ rows, rowCount })
        })

    }, [dataView]);

    const handleVerticalScroll = useCallback(e => {
        if (e.target === e.currentTarget) {
            scrollTop.current = e.target.scrollTop;
            const firstRow = Math.floor(scrollTop.current / model.rowHeight)
            if (firstRow !== firstVisibleRow.current) {
                const numberOfRowsInViewport = Math.ceil(height / model.rowHeight) + 1;
                dataView.setRange(firstRow, firstRow + numberOfRowsInViewport);
                firstVisibleRow.current = firstRow;
                callbackPropsDispatch({type: 'scroll', scrollTop: scrollTop.current})
            }
        }
    },[]);

    const handleHorizontalScroll = useCallback(e => {
        if (e.target === e.currentTarget) {
            const scrollLeft = e.target.scrollLeft;
            scrollingCanvas.current.setScrollLeft(scrollLeft);
            callbackPropsDispatch({type: 'scroll', scrollLeft})
        }
    },[])

    useEffect(() => {
        console.log(`%clets see how often this sucker reruns`,'color:brown;font-weight:bold;')
    },[])

    useEffect(() => {
        console.log(`useEffect selectionState changed to ${JSON.stringify(selectionState)}`)
    }, [selectionState])

    // should this be handled here or at the grid level ?
    const selectionHandler = useCallback((idx, selectedItem, rangeSelect, incrementalSelection) => {
        const { selectionModel } = model;
        // we must also allow selected to be injected via props
        setSelectionState(state => {
            const { selected, lastTouchIdx } = SelectionModel.handleItemClick(selectionModel, state, idx, selectedItem, rangeSelect, incrementalSelection);
            callbackPropsDispatch({type: 'selection', selected, idx, selectedItem})
            return { focusedIdx: idx, selected, lastTouchIdx }
        });
    },[]);

    const handleToggleGroup = useCallback(groupRow => {
        const groupState = groupHelpers.toggleGroupState(groupRow, model);
        dispatch({ type: Action.TOGGLE, groupState });
    })

    const horizontalScrollingRequired = model.totalColumnWidth > model.displayWidth;
    // we shouldn't need to change this but chrome does not handle this correctly - vertical scrollbar is still
    // displayed even when not needed, when grid is stretched.
    const maxContentHeight = horizontalScrollingRequired ? height - 15 : height; // we should know the scrollbarHeight
    const contentHeight = Math.max(model.rowHeight * data.rowCount, maxContentHeight);
    const displayWidth = contentHeight > height
        ? model.width - scrollbarSize
        : model.width;
    const overflow = displayWidth === model.width ? 'hidden' : 'auto';
    console.log(`contentHeight = ${contentHeight}`)

    let emptyRows = groupBy.current === model.groupBy
        ? null
        : ((groupBy.current = model.groupBy), []);


    return (
        <>
        <div className='Viewport' style={{ ...css.Viewport, ...style }}>

            {horizontalScrollingRequired &&
                model._groups.filter(colGroup => !colGroup.locked).map((colGroup, idx) =>
                    <div className='CanvasScroller horizontal scrollable-content'
                        ref={scrollableContainerEl}
                        key={idx} style={{ left: colGroup.renderLeft, width: colGroup.renderWidth }}
                        onScroll={handleHorizontalScroll}>

                        <div className='CanvasScroller-content' style={{ width: colGroup.width, height: 15 }} />
                    </div>
                )
            }

            <div className='ViewportContent scrollable-content'
                ref={verticalScrollContainer}
                style={{ ...css.ViewportContent, bottom: horizontalScrollingRequired ? 15 : 0, overflow }}
                onScroll={handleVerticalScroll} >

                <div className='scrolling-canvas-container'
                    style={{ width: model.displayWidth, height: contentHeight }}>
                    {
                        model._groups.map((columnGroup, idx) =>
                            <Canvas
                                key={idx}
                                gridModel={model}
                                rows={emptyRows || data.rows}
                                selectedRows={selectionState.selected}
                                firstVisibleRow={firstVisibleRow.current}
                                height={contentHeight}
                                ref={columnGroup.locked ? null : scrollingCanvas}
                                columnGroup={columnGroup}
                                // focusedRow={this.state.focusedIdx}
                                onToggleGroup={handleToggleGroup}
                                onCellClick={onCellClick}
                                onContextMenu={onContextMenu}
                                onSelect={selectionHandler} />
                        )}
                </div>
            </div>
        </div>
        {model._movingColumn &&
            <ColumnBearer gridModel={model} rows={data.rows} />}

        </>
    );

})
