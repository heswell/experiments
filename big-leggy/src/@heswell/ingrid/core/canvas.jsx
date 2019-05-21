import React, { useEffect, useContext, useRef, useImperativeHandle, forwardRef } from 'react';
import cx from 'classnames';
import Row from './row';
import GridContext from '../grid-context';

import css from '../style/grid';

const byKey = ([key1], [key2]) => key1 - key2;

export default forwardRef(Canvas)

export function Canvas ({
  cellClass,
  cellRenderer,
  columnGroup,
  firstVisibleRow,
  gridModel,
  height,
  rowClass,
  rows,
  selectedRows,
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
        const [absIdx] = rowPositions[i];
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
    const isSelected = selectedRows.includes(absIdx);
    // TODO selected should be present in the row meta
    const isLastSelected = isSelected && (absIdx === rows.length - 1 || !selectedRows.includes(absIdx + 1));
    return [absIdx, row[RENDER_IDX], row, isSelected, isLastSelected]
  })
    .filter(([key]) => key !== undefined)
    .sort(byKey)

  const gridRows = rowPositions
    .map(([abs_idx, key, row, isSelected, isLastSelected]) => {

      return (
        <Row key={key}
          idx={abs_idx}
          row={row}
          isSelected={isSelected}
          isLastSelected={isLastSelected}
          meta={gridModel.meta}
          columns={columnGroup.columns}
          rowClass={rowClass}
          cellClass={cellClass}
          cellRenderer={cellRenderer}
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
