import cx from 'classnames';

const columnType = column =>
  !column.type ? null
    : typeof column.type === 'string' ? column.type
    : column.type.name;

// we want to allow css class to be determined by value
export function getGridCellClassName(column, value){

  return cx(
      'GridCell',
      column.className,
      columnType(column),
      column.resizing ? 'resizing' : null,
      column.moving ? 'moving' : null
  );
}
