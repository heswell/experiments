import {DataSource} from '@heswell/data';
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
  dataView: DataSource
  emptyDisplay?: any;
  headerHeight?: number;
  onDoubleClick?: Function;
  onScroll?: Function;
  onSelectCell?: Function;
  onSelectionChange?: Function;
  onSingleSelect?: Function;
  rowStripes?: boolean;
  showHeaders?: ShowHeaders;
  showHeaderWhenEmpty?: boolean;
  style: any;
}

declare const Grid: React.ComponentType<GridProps>;
export default Grid;