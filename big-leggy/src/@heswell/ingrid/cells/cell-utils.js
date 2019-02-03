import cx from 'classnames';

export function getGridCellClassName(column, value, cellClass=null){

  const type = (column.type && column.type.name) || null;

  return cx(
      'GridCell',
      column.className,
      column.cellCSS,
      type,
      cellClass ? cellClass(value, column) : null,
      column.resizing ? 'resizing' : null,
      column.moving ? 'moving' : null
  );
}
