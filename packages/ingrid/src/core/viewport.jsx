import React, { /*useState, */useCallback, useContext, useRef, useEffect, useReducer } from 'react';
import { createLogger, logColor } from '@heswell/utils';
import Canvas from './canvas.jsx';
import ColumnBearer from './column-bearer.jsx';
// import SelectionModel from '../model/selectionModel';
import * as Action from '../model/actions';
import dataReducer, { initialData } from '../model/data-reducer';
import { getScrollbarSize } from '../utils/domUtils';
import GridContext from '../grid-context';

const logger = createLogger('Viewport', logColor.green)

const scrollbarSize = getScrollbarSize();

const cssViewport = {
    position: 'absolute',
    top: 25,
    left:0,
    right:0,
    bottom:0,
    padding:0,
    overflow: 'hidden'
};

const cssViewportContent = {
    position: 'absolute',
    top:0,
    left:0,
    right:0,
    padding:0
};

function useThrottledScroll(callback) {

    const timeoutHandler = useRef(null);
    const prevValue = useRef(null);
    const value = useRef(null);

    const raf = () => {
        if (value.current !== prevValue.current){
            callback(value.current);
            prevValue.current = value.current;
            timeoutHandler.current = requestAnimationFrame(raf)
        } else {
            timeoutHandler.current = null;
        }
    }

    const throttledCallback = useCallback(
        e => {
            value.current = e.target.scrollTop;
            if (timeoutHandler.current === null){
                timeoutHandler.current = requestAnimationFrame(raf);
            }
        },
        [callback]
    );

    return throttledCallback;
}

export const Viewport = React.memo(({
    style,
    height,
    dataView,
    model,
    onFilterChange
    // selectedRows
}) => {
    const scrollingCanvas = useRef(null);
    const scrollableContainerEl = useRef(null);
    const verticalScrollContainer = useRef(null);
    const scrollTop = useRef(0);
    const firstVisibleRow = useRef(0);
    const groupBy = useRef(model.groupBy);
    const rowCount = useRef(model.rowCount);

    const { dispatch, callbackPropsDispatch } = useContext(GridContext);

    const [data, dispatchData] = useReducer(dataReducer(model), initialData);

    useEffect(() => {
        rowCount.current = model.rowCount
    },[model.rowCount])

    useEffect(() => {

        // todo move into model
        const viewportSize = Math.ceil(height / model.rowHeight) + 1
        dataView.subscribe({
            columns: model.columns,
            range: { lo: 0, hi: viewportSize }
        },
            /* postMessageToClient */
            msg => {

                if (msg.range && msg.range.reset) {
                    setSrollTop(0);
                }

                if (msg.filter !== undefined){
                    onFilterChange(msg.filter);
                }

                if (typeof msg.size === 'number' && msg.size !== rowCount.current) {
                    dispatch({ type: Action.ROWCOUNT, rowCount: msg.size })
                }
                if (msg.rows) {
                    dispatchData({ type: 'data', rows: msg.rows, rowCount: msg.size, offset: msg.offset, range: msg.range });
                } else if (msg.updates){
                    dispatchData({ type: 'update', updates: msg.updates, range: msg.range });
                } else if (msg.selected) {
                    dispatchData({ type: 'selected', selected: msg.selected, deselected: msg.deselected })
                } else if (msg.type === 'subscribed'){
                    dispatch({type: Action.SUBSCRIBED, columns: msg.columns, availableColumns: msg.availableColumns});
                }
            }
        )

        return () => dataView.unsubscribe();

    }, [dataView]);

    useEffect(() => {
        const rowCount = Math.ceil(height / model.rowHeight) + 1;
        // careful model might be out of date
        if (rowCount !== model.rowCount) {
            dispatch({ type: Action.ROWCOUNT, rowCount })
            const firstRow = firstVisibleRow.current;
            setRange(firstRow, firstRow + rowCount);
        }

    }, [height])

    const handleVerticalScroll = useThrottledScroll(useCallback(value => {
        scrollTop.current = value;
        const firstRow = Math.floor(value / model.rowHeight)
        if (firstRow !== firstVisibleRow.current) {
            const numberOfRowsInViewport = Math.ceil(height / model.rowHeight) + 1;
            firstVisibleRow.current = firstRow;
            setRange(firstRow, firstRow + numberOfRowsInViewport);
        }

    }, []), 30);

    const handleHorizontalScroll = useCallback(e => {
        if (e.target === e.currentTarget) {
            const scrollLeft = e.target.scrollLeft;
            scrollingCanvas.current.scrollLeft(scrollLeft);
            callbackPropsDispatch({ type: 'scroll', scrollLeft })
        }
    }, [])

    const setSrollTop = useCallback((value) => {
        verticalScrollContainer.current.scrollTop = scrollTop.current = value;
    }, [])

    const setRange = useCallback((lo, hi) => {
        //logger.log(`setRange ===>  ${lo} : ${hi}`)
        dispatchData({ type: 'range', range: { lo, hi } });
        dataView.setRange(lo, hi);
    }, [])

    // all of these calculations belong in the modelReducer
    const horizontalScrollingRequired = model.totalColumnWidth > model.displayWidth;
    // we shouldn't need to change this but chrome does not handle this correctly - vertical scrollbar is still
    // displayed even when not needed, when grid is stretched.
    const maxContentHeight = horizontalScrollingRequired ? height - 15 : height; // we should know the scrollbarHeight
    const contentHeight = Math.max(model.rowHeight * data.rowCount, maxContentHeight);
    const displayWidth = contentHeight > height
        ? model.width - scrollbarSize
        : model.width;
    const overflow = displayWidth === model.width ? 'hidden' : 'auto';

    let emptyRows = groupBy.current === model.groupBy
        ? null
        : ((groupBy.current = model.groupBy), []);


    return (
        <>
            <div className='Viewport' style={{ ...cssViewport, ...style }}>

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
                    style={{ ...cssViewportContent, bottom: horizontalScrollingRequired ? 15 : 0, overflow }}
                    onScroll={handleVerticalScroll} >

                    <div className='scrolling-canvas-container'
                        style={{ width: model.displayWidth, height: contentHeight }}>
                        {
                            model._groups.map((columnGroup, idx) =>
                                <Canvas
                                    key={idx}
                                    gridModel={model}
                                    rows={emptyRows || data.rows}
                                    firstVisibleRow={firstVisibleRow.current}
                                    height={contentHeight}
                                    ref={columnGroup.locked ? null : scrollingCanvas}
                                    columnGroup={columnGroup}
                                />
                            )}
                    </div>
                </div>
            </div>
            {model._movingColumn &&
                <ColumnBearer gridModel={model} rows={data.rows} />}

        </>
    );

})
