import React from 'react';

interface HeaderCellProps {
  className?: string;
  column: Column;
  multiColumnSort?: boolean;
  onClick?: (column: Column) => void;
  onContextMenu?: (...args: any[]) => void;
  onMove?: (phase: Phase, column: Column, distance?: number) => void;
  onResize?: (phase: Phase, column: Column, width?: number) => void;
}


export type HeaderCellComponent = React.ComponentType<HeaderCellProps>;

declare const HeaderCell: HeaderCellComponent;
export default HeaderCell;