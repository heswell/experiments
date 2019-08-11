import React, { useContext, useRef, useImperativeHandle, forwardRef } from 'react';
import cx from 'classnames';
import Row from './row.jsx';
import GridContext from '../grid-context';

const byKey = ([key1], [key2]) => key1 - key2;

const cssCanvas = {
  position: 'absolute',
  top:0,
  overflow:'hidden'
};

const cssCanvasContent = {
  position: 'absolute',
  overflow : 'hidden'
};

export default forwardRef(Canvas)

export function Canvas ({
  columnGroup,
  firstVisibleRow,
  gridModel,
  height,
  rows,
  onKeyDown
}, ref) {
  const contentEl = useRef(null);
  const {showContextMenu} = useContext(GridContext);

  useImperativeHandle(ref, () => ({
    scrollLeft: scrollLeft => {
      contentEl.current.style.left = `-${scrollLeft}px`;
    }
  }))

  const handleContextMenuFromCanvas = (e) => {
    showContextMenu(e, 'canvas')
  }

  const { renderLeft: left, renderWidth: width } = columnGroup;
  const { RENDER_IDX } = gridModel.meta;
  const rowPositions = rows.map((row, idx) => {
    const absIdx = firstVisibleRow + idx
    return [row[RENDER_IDX], absIdx, row]
  })
  .sort(byKey)

  const gridRows = rowPositions
    .map(([key, abs_idx, row]) => {
      return (
        <Row key={key}
          idx={abs_idx}
          row={row}
          gridModel={gridModel}
          columns={columnGroup.columns}
        />
      )
    });

  const className = cx('Canvas', {
    fixed: columnGroup.locked
  });

  return (
    <div style={{ ...cssCanvas, left, width, height }} className={className}
      onContextMenu={handleContextMenuFromCanvas}
      onKeyDown={onKeyDown} >
      <div ref={contentEl}
        style={{ ...cssCanvasContent, width: Math.max(columnGroup.width, width), height }}>
        {gridRows}
      </div>
    </div>
  );
}
