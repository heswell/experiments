/**
 * 
 * @typedef {import('./viewport').DataReducer} DataReducer
 */
import React, { /*useState, */useCallback, useContext, useLayoutEffect, useRef, useEffect, useReducer } from 'react';
import cx from 'classnames';

import * as Action from '../model/actions';
import Canvas from './canvas/canvas.jsx';
import ColumnBearer from './column-bearer.jsx';
import dataReducer, { initialData } from '../model/data-reducer';
import GridContext from '../grid-context';

import './viewport.css';

function useThrottledScroll(callback) {
    const timeoutHandler = useRef(null);
    const prevValue = useRef(null);
    const value = useRef(null);

    // this is constantly recreated during scroll
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

/** @type {ViewportComponent} */
const Viewport = React.memo(function Viewport({
    columnHeaders=[],
    dataSource,
    height,
    model,
    onFilterChange,
    scrollState,
    top
}){

    const canvasRefs = useRef([]);
    // const scrollingCanvas = useRef(null);
    const scrollableContainerEl = useRef(null);
    const verticalScrollContainer = useRef(null);
    const scrollTop = useRef(0);
    const firstVisibleRow = useRef(0);
    const groupBy = useRef(model.groupBy);
    const rowCount = useRef(model.rowCount);

    const { dispatch, callbackPropsDispatch } = useContext(GridContext);
    /** @type {DataReducer} */
    const [data, dispatchData] = useReducer(dataReducer(model), initialData);

    useLayoutEffect(() => {
        console.log(`[Viewport] useLayoutEffect, scrolling has changed, scrolling ${scrollState.scrolling} `)
    },[scrollState.scrolling]);

    useEffect(() => {
        rowCount.current = model.rowCount
    },[model.rowCount])

    useEffect(() => {
        // required only when column is dragged outside viewport, causing programatic scroll ?
        console.log(`setScrollLeft ${model.scrollLeft}`)
        setSrollLeft(model.scrollLeft);
    },[model.scrollLeft])

    useLayoutEffect(() => {
        if (!scrollState.scrolling){
            console.log(`>>>>>>> we're not scrolling, scrollLeft = ${scrollState.scrollLeft} >>>>>>>>`)
        }
    },[scrollState.scrolling])


    // TOFO useDataSource(dataSource, columns, rangs)
    useEffect(() => {

        // todo move into model
        const viewportSize = Math.ceil(height / model.rowHeight) + 1
        dataSource.subscribe({
            columns: model.columns,
            range: { lo: 0, hi: viewportSize }
        },
            /* postMessageToClient */
            msg => {

                if (msg.range && msg.range.reset) {
                    // wait - this will no reset model
                    setSrollTop(0);
                }

                if (msg.filter !== undefined){
                    console.log(`we have a new filter ${JSON.stringify(msg.filter,null,2)}`)
                    onFilterChange(msg.filter);
                }

                if (typeof msg.size === 'number' && msg.size !== rowCount.current) {
                    console.log(`rowCount.current = ${rowCount.current} model says ${model.rowCount} new value ${msg.size}`)
                    rowCount.current = msg.size;
                    dispatch({ type: Action.ROWCOUNT, rowCount: msg.size });
                    dispatchData({ type: Action.ROWCOUNT, rowCount: msg.size });
                }
                if (msg.rows) {
                    dispatchData({ type: 'data', rows: msg.rows, rowCount: msg.size, offset: msg.offset, range: msg.range });
                } else if (msg.updates){
                    dispatchData({ type: 'update', updates: msg.updates });
                } else if (msg.type === 'subscribed'){
                    dispatch({type: Action.SUBSCRIBED, columns: msg.columns, availableColumns: msg.availableColumns});
                }
            }
        )

        return () => dataSource.unsubscribe();

    }, [dataSource]);

    useEffect(() => {
        const rowCount = Math.ceil(height / model.rowHeight) + 1;
        // careful model might be out of date
        // if (rowCount !== model.rowCount) {
            // dispatch({ type: Action.ROWCOUNT, rowCount })
            const firstRow = firstVisibleRow.current;
            // initial call to setRange
            setRange(firstRow, firstRow + rowCount);
        // }

    }, [height]);

    const scrollTimer = useRef(null);

    const handleVerticalScroll = useThrottledScroll(useCallback(value => {
        if (scrollTop.current === value){
            return;
        }
        function onScrollEnd(){
            scrollTimer.current = null;
            console.log(`VERTICAL SCROLLING HAS STOPPED`)
            verticalScrollContainer.current.classList.remove('scrolling');
            // we only need to do this for scrolling Canvas
            canvasRefs.current.forEach(canvas => canvas.scrollTop(value));
        }

        if (scrollTimer.current){
            clearTimeout(scrollTimer.current);
        } else {
            console.log(`add the scrolling class to viewport`);
            verticalScrollContainer.current.classList.add('scrolling');
        }
        scrollTimer.current = setTimeout(onScrollEnd,200);

        scrollTop.current = value;
        const firstRow = Math.floor(value / model.rowHeight);
        // scrollingCanvas.current.scrollTop(value);
        if (firstRow !== firstVisibleRow.current) {
            const numberOfRowsInViewport = Math.ceil(height / model.rowHeight) + 1;
            firstVisibleRow.current = firstRow;
            setRange(firstRow, firstRow + numberOfRowsInViewport);
        }

    }, [height]));

    const setSrollTop = useCallback((value) => {
        verticalScrollContainer.current.scrollTop = scrollTop.current = value;
    }, [])

    const setSrollLeft = useCallback((value) => {
        if (scrollableContainerEl.current){
            scrollableContainerEl.current.scrollLeft = value;
        }
    }, [])

    const setRange = useCallback((lo, hi) => {
        //logger.log(`setRange ===>  ${lo} : ${hi}`)
        dispatchData({ type: 'range', range: { lo, hi } });
        dataSource.setRange(lo, hi);
    }, [])

    let emptyRows = groupBy.current === model.groupBy
        ? null
        : ((groupBy.current = model.groupBy), []);

    const className = cx('Viewport', {
        stripes: model.rowStripes
    })    

    return (
        <>
            <div className={className} style={{top}}
                ref={verticalScrollContainer}
                onScroll={handleVerticalScroll}>
                
                <div className='scrolling-canvas-container'
                    style={{ width: model.displayWidth, height: model.dimensions.contentHeight }}>
                    {
                        model.columnGroups.map((columnGroup, idx) =>
                            <Canvas
                                columnGroup={columnGroup}
                                columnHeader={columnHeaders[idx]}
                                firstVisibleRow={firstVisibleRow.current}
                                gridModel={model}
                                height={height}
                                key={idx}
                                ref={canvas => canvasRefs.current[idx] = canvas}
                                rows={emptyRows || data.rows}
                            />
                        )}
                </div>
            </div>
            {model._movingColumn &&
                <ColumnBearer gridModel={model} rows={data.rows} />}
        </>
    );

})


export default Viewport;