import React, { useContext, useReducer, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import cx from 'classnames';
import Row from '../row';
import GridContext from '../../grid-context';
import canvasReducer, {init as initCanvasReducer} from './canvas-reducer';
// import * as Action from '../model/actions';
import useScroll from './use-scroll';

import './canvas.css';

const byKey = ([key1], [key2]) => key1 - key2;

export default forwardRef(Canvas)

/** @type {CanvasComponent} */
export function Canvas ({
  columnGroup,
  columnHeader,
  firstVisibleRow,
  gridModel,
  height,
  rows,
}, ref) {// we're not actually assigning ref
  console.log(`[Canvas] render`);

  const contentEl = useRef(null);
  const scrollContainer = useRef(null);
  const {callbackPropsDispatch, showContextMenu} = useContext(GridContext);

  const [[columns, keys], dispatchCanvasAction] = useReducer(canvasReducer, {
    gridModel, columnGroup}, initCanvasReducer)


  const handleHorizontalScroll = useScroll(scrollContainer, 200, (type, scrollLeft) => {
    if (type === 'scroll-start-horizontal'){
      callbackPropsDispatch({type});
    } else if (type === 'scroll-end-horizontal'){
      callbackPropsDispatch({type, scrollLeft});
    } else {
      dispatchCanvasAction({type, gridModel, columnGroup, scrollLeft})
    }
  });

  useImperativeHandle(ref, () => ({
    // Do we still need this ?
    scrollLeft: scrollLeft => {
      contentEl.current.style.left = `-${scrollLeft}px`;
    },
    scrollTop: scrollTop => {
      contentEl.current.style.transform = `translate3d(0px, -${scrollTop}px, 0px)`;
    }
  }));

  const handleContextMenuFromCanvas = (e) => {
    showContextMenu(e, 'canvas')
  }

  const { renderLeft: left, renderWidth: width } = columnGroup;
  const { contentHeight, meta: {RENDER_IDX}} = gridModel;
  const rowPositions = rows.map((row, idx) => {
    const absIdx = firstVisibleRow + idx
    return [row[RENDER_IDX], absIdx, row]
  })
  .sort(byKey)

  const gridRows = rowPositions
    .map(([rowKey, absIdx, row]) => {
      return (
        <Row key={rowKey}
          columns={columns}
          gridModel={gridModel}
          idx={absIdx}
          keys={keys}
          row={row}
        />
      )
    });

  const className = cx('Canvas', {
    fixed: columnGroup.locked,
    scrollable: !columnGroup.locked
  });

  const top = columnHeader ? gridModel.headerHeight : 0;

  return (
    <div className={className} style={{ left, width, height }} 
      onContextMenu={handleContextMenuFromCanvas}
      onScroll={handleHorizontalScroll} 
      ref={columnGroup.locked ? null : scrollContainer}>
          <div className="canvas-content-wrapper">
          {columnHeader}
          <div ref={contentEl} className="canvas-content"
            style={{ width: Math.max(columnGroup.width, width), height: contentHeight, top }}>
            {gridRows}
          </div>
          </div>
    </div>
  );
}
