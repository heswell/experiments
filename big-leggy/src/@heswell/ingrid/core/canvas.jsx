import React, { useEffect, useContext, useRef, useImperativeHandle, forwardRef } from 'react';
import cx from 'classnames';
import Row from './row';
import GridContext from '../grid-context';

import css from '../style/grid';

const byKey = ([key1], [key2]) => key1 - key2;

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

  useEffect(() => {
    const container = contentEl.current;
    if (container) {
      const {rowHeight} = gridModel
      const { children, childElementCount } = container;
      for (let i = 0; i < childElementCount; i++) {
        const child = children[i];
        const [,absIdx] = rowPositions[i];
        child.style.transform = `translate3d(0px, ${absIdx*rowHeight}px, 0px)`
      }
    }
  }, [rows])

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
      // onsole.log(`Row ${row[gridModel.meta.KEY]} [${row[gridModel.meta.IDX]}] = ${key} absIdx=${abs_idx} firstVisibleRow=${firstVisibleRow}`)
      return (
        <Row key={key}
          idx={abs_idx}
          row={row}
          meta={gridModel.meta}
          columns={columnGroup.columns}
        />
      )
    });

  // console.log(`%c[Canvas] rowsRendered = ${gridRows.length}`,'color: red; font-weight: bold;')

  const className = cx('Canvas', {
    fixed: columnGroup.locked
  });

  return (
    <div style={{ ...css.Canvas, left, width, height }} className={className}
      onContextMenu={handleContextMenuFromCanvas}
      onKeyDown={onKeyDown} >
      <div ref={contentEl}
        style={{ ...css.CanvasContent, width: Math.max(columnGroup.width, width), height }}>
        {gridRows}
      </div>
    </div>
  );
}
