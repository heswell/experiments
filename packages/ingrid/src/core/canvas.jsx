import React, { useContext, useRef, useImperativeHandle, forwardRef } from 'react';
import cx from 'classnames';
import Row, {PADDING_CELL} from './row.jsx';
import GridContext from '../grid-context';
import * as Action from '../model/actions';

import './canvas.css';

const byKey = ([key1], [key2]) => key1 - key2;

//TODO move to model
function useKeys(columns){
  const map = useRef(new Map(columns.map((column,idx) => [column.key, idx])));
  const maxKey = useRef(map.current.size);

  function nextKey(){
    const next = maxKey.current;
    maxKey.current += 1;
    console.log(`next key assigned ${next}`)
    return next;
  }

  if (!columns.every(column => map.current.has(column.key))){

    const map1 = map.current;
    const map2 = new Map();
    const columnsAwaitingKeys = [];
  
    columns.forEach(column => {
      if (map1.has(column.key)){
        map2.set(column.key, map1.get(column.key));
        map1.delete(column.key);
      } else {
        columnsAwaitingKeys.push(column.key)
      }
    });
  
    const freeKeys = Array.from(map1.values());
    columnsAwaitingKeys.forEach(columnKey => {
      map2.set(columnKey, freeKeys.length ? freeKeys.shift(): nextKey());
    })
    
    map.current = map2;
    
  }

  return map.current;
}

export default forwardRef(Canvas)

/** @type {CanvasComponent} */
export function Canvas ({
  columnGroup,
  contentHeight,
  firstVisibleRow,
  gridModel,
  height,
  rows
}, ref) {// we're not actually assigning ref
  const contentEl = useRef(null);
  const {callbackPropsDispatch, dispatch, showContextMenu} = useContext(GridContext);

  useImperativeHandle(ref, () => ({
    scrollLeft: scrollLeft => {
      contentEl.current.style.left = `-${scrollLeft}px`;
    },
    scrollTop: scrollTop => {
      contentEl.current.style.transform = `translate3d(0px, -${scrollTop}px, 0px)`;
    }
  }));

  const handleHorizontalScroll = e => {
    // bubbling will trigger Viewport scroll handler.
    e.stopPropagation();
    dispatch({ type: Action.SCROLLLEFT, scrollLeft: e.target.scrollLeft});
    callbackPropsDispatch({ type: 'scroll', scrollLeft: e.target.scrollLeft })
  }

  const handleContextMenuFromCanvas = (e) => {
    showContextMenu(e, 'canvas')
  }

  const { columns, renderLeft: left, renderWidth: width } = columnGroup;
  const { meta: {RENDER_IDX}, virtualCanvas } = gridModel;
  const rowPositions = rows.map((row, idx) => {
    const absIdx = firstVisibleRow + idx
    return [row[RENDER_IDX], absIdx, row]
  })
  .sort(byKey)

  //TODO move this to model
  const columnsToRender = virtualCanvas && !columnGroup.locked
  ? [{key: -1, name: PADDING_CELL, width: gridModel.virtualCanvas.offset}, ...columns.slice(virtualCanvas.firstColumnIdx, virtualCanvas.lastColumnIdx + 1)] 
  : columns;

  const keys = useKeys(columnsToRender);

  const gridRows = rowPositions
    .map(([key, abs_idx, row]) => {
      return (
        <Row key={key}
          columns={columnsToRender}
          gridModel={gridModel}
          idx={abs_idx}
          keys={keys}
          row={row}
        />
      )
    });

  const className = cx('Canvas', {
    fixed: columnGroup.locked,
    scrolling: !columnGroup.locked
  });

  return (
    <div style={{ left, width, height }} className={className}
      onContextMenu={handleContextMenuFromCanvas}
      onScroll={handleHorizontalScroll}>
      <div ref={contentEl} className="canvas-content"
        style={{ width: Math.max(columnGroup.width, width), height: contentHeight }}>
        {gridRows}
      </div>
    </div>
  );
}
