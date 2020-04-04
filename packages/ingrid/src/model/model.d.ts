
type FlashStyle = 'arrow' | 'bg-only' | 'arrow-bg';
export interface ColumnType {
  name: string;
  renderer?: {
    flashStyle?: FlashStyle;
  };
}

export interface Column {
  aggregate?: string;
  className?: string;
  // TODO need a more specialized type for GroupCell
  collapsed?: boolean;
  columns?: Column[];
  hidden?: boolean;
  isGroup?: boolean;
  key?: number;
  name: string;
  resizeable?: boolean;
  resizing?: boolean;
  type?: string | ColumnType;
  width?: number;
}

export interface ColumnGroup {
  columns: Column[];
  headings?: string[];
  locked: boolean;
  renderLeft: number;
  renderWidth: number;
  width: number;
}

export interface GridModel {
  availableColumns: Column[];
  collapsedColumns: any;
  columnMap: any;
  columns: Column[];
  displayWidth: number;
  groupBy: any;
  groupColumnWidth: number | 'auto';
  groupState: any;
  headerHeight: number;
  height: number;
  meta: any;
  minColumnWidth: number;
  rowCount: number;
  rowHeight: number;
  rowStripes: boolean;
  selectionModel: any;
  scrollbarSize: number;
  scrollLeft: number;
  sortBy: any;
  totalColumnWidth: number;
  width: number;
  _columnDragPlaceholder: any;
  _groups: ColumnGroup[];
  _headingDepth: number;
  _headingResize: any;
  _movingColumn: any;
  _overTheLine: number;
}

export type GridModelReducer = (state: GridModel, action: any) => GridModel;
export type ReducerTable = {[key: string]: GridModelReducer};