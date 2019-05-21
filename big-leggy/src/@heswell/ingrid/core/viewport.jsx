import React, { /*useState, */useCallback, useContext, useRef, useEffect, useReducer } from 'react';
import Canvas from './canvas';
import ColumnBearer from '../core/ColumnBearer';
import css from '../style/grid';
// import SelectionModel from '../model/selectionModel';
import * as Action from '../model/actions';
import dataReducer from '..//model/dataReducer';
import { getScrollbarSize } from '../utils/domUtils';
import GridContext from '../grid-context';

const scrollbarSize = getScrollbarSize();

export const Viewport = React.memo(({
    style,
    height,
    dataView,
    model,
    // selectedRows
}) =>  {

    const scrollingCanvas = useRef(null);
    const scrollableContainerEl = useRef(null);
    const verticalScrollContainer = useRef(null);
    const scrollTop = useRef(0);
    const firstVisibleRow = useRef(0);
    const groupBy = useRef(model.groupBy);

    const {dispatch, callbackPropsDispatch} = useContext(GridContext);

    // const [selectionState, setSelectionState] = useState(SelectionModel.getInitialState(selectedRows));

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
        }, (rows, rowCount, selected=null, deselected=null) => {
            if (rowCount !== null && rowCount !== model.rowCount){
                dispatch({type: Action.ROWCOUNT, rowCount})
            }
            if (rows !== null){
                dispatchData({ type: 'data', rows, rowCount })
            } else if (selected !== null){
                dispatchData({type: 'selected', selected, deselected})
            }
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
            scrollingCanvas.current.scrollLeft(scrollLeft);
            callbackPropsDispatch({type: 'scroll', scrollLeft})
        }
    },[])

    // should this be handled here or at the grid level ?
    // const selectionHandler = useCallback((idx, selectedItem, rangeSelect, incrementalSelection) => {
    //     const { selectionModel } = model;
    //     // we must also allow selected to be injected via props
    //     setSelectionState(state => {
    //         const { selected, lastTouchIdx } = SelectionModel.handleItemClick(selectionModel, state, idx, selectedItem, rangeSelect, incrementalSelection);
    //         callbackPropsDispatch({type: 'selection', selected, idx, selectedItem})
    //         return { focusedIdx: idx, selected, lastTouchIdx }
    //     });
    // },[]);

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
                                selectedRows={data.selected}
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
