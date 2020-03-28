// @ts-check
import React, { useContext, useRef, useImperativeHandle, forwardRef } from 'react';
import cx from 'classnames';
import Row from './row.jsx';
import GridContext from '../grid-context';

import './canvas.css';

const byKey = ([key1], [key2]) => key1 - key2;

export default forwardRef(Canvas)

export function Canvas ({
  columnGroup,
  firstVisibleRow,
  gridModel,
  height,
  rows
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
    <div style={{ left, width, height }} className={className}
      onContextMenu={handleContextMenuFromCanvas} >
      <div ref={contentEl} className="canvas-content"
        style={{ width: Math.max(columnGroup.width, width), height }}>
        {gridRows}
      </div>
    </div>
  );
}
