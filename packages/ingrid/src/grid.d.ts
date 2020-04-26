import React from 'react';
import {DataSource} from '@heswell/data-source';
import {Column} from './model/model';

export interface ShowHeaders {
  showColumnHeader?: boolean;
  showSelectHeader?: boolean;
  showInlineFilter?: boolean;
}

export interface GridProps {
  className?: string;
  colHeaderRenderer?: any;
  columns: Column[];
  dataSource: DataSource
  emptyDisplay?: any;
  headerHeight?: number;
  onDoubleClick?: GridActionHandler<'double-click'>;
  onScroll?: Function;
  onSelectCell?: GridActionHandler<'select-cell'>;
  onSelectionChange?: Function;
  onSingleSelect?: Function;
  rowStripes?: boolean;
  showHeaders?: ShowHeaders;
  showHeaderWhenEmpty?: boolean;
  style: any;
}

export type GridComponent = React.FunctionComponent<GridProps>;
declare const Grid: GridComponent;
export default Grid;