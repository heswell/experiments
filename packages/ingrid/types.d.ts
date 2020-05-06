
type FlashStyle = 'arrow' | 'bg-only' | 'arrow-bg';

type sortDirection = 'asc' | 'dsc';
type sortColumn = [string, sortDirection];

interface DataRange {
  lo: number;
  hi: number;
}

interface SubscriptionOptions {
  columns: Column[];
  range?: DataRange;
}

interface DataSource {
  filter: (filter: any, dataType?: string, incremental?: boolean) => void;
  group: (groupBy: sortColumn[]) => void;
  setRange: (lo: number, hi: number, dataType?: string) => void;
  subscribe: (options: SubscriptionOptions, callback:() => void) => Promise<void>;
  select: (idx: number, rangeSelect: boolean, keepExistingSelection: boolean) => void;
  setGroupState: (groupState: any) => void;
  size: number;
  sort: (sortBy: sortColumn[]) => void;
  unsubscribe: () => void;
}

interface ColumnType {
  name: string;
  renderer?: {
    flashStyle?: FlashStyle;
  };
}

interface Column {
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

interface ColumnGroup {
  columns: Column[];
  headings?: string[];
  /**
   * A locked column group does not scroll horizontally.
   */
  locked: boolean;
  /**
   * The width available on screen for the column group;
   */
  renderWidth: number;
  /**
   * The combined widths of all columns in the group
   */
  width: number;
}

type ColumnMeta = {
  [key: string]: number;
}

interface GridModel {
  availableColumns: Column[];
  collapsedColumns: any;
  columnMap: any;
  columnGroups: ColumnGroup[];
  columns: Column[];
  dimensions: {
    contentHeight: number;
    width: number;
    height: number;
  };
  displayWidth: number;
  groupBy: any;
  groupColumnWidth: number | 'auto';
  groupState: any;
  headerHeight: number;
  meta: ColumnMeta;
  minColumnWidth: number;
  rowCount: number;
  rowHeight: number;
  rowStripes: boolean;
  selectionModel: any;
  scrollbarSize: number;
  scrollLeft: number;
  sortBy: any;
  totalColumnWidth: number;
  _columnDragPlaceholder: any;
  _headingDepth: number;
  _headingResize: any;
  _movingColumn: any;
  _overTheLine: number;
}

type GridModelReducer = (state: GridModel, action: any) => GridModel;

interface ShowHeaders {
  showColumnHeader?: boolean;
  showSelectHeader?: boolean;
  showInlineFilter?: boolean;
}

interface GridProps {
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

interface ViewportProps {
  columnHeaders?: React.ReactElement[];
  dataSource: DataSource;
  height: number;
  model: GridModel;
  onFilterChange: any;
  ref?: React.MutableRefObject<any>;
  scrollState: {
    scrolling: boolean,
    scrollLeft: number;
  };
  top: number;
}

type ViewportComponent = (props: ViewportProps, ref: React.MutableRefObject<any>) => JSX.Element;

interface CanvasProps {
  columnGroup: ColumnGroup;
  columnHeader?: React.ReactElement;
  firstVisibleRow: number;
  gridModel: GridModel;
  height: number;
  rows: any[];
}

type CanvasComponent = (props: CanvasProps, ref: React.RefObject<any>) => JSX.Element;

type Phase = 'begin' | 'resize' | 'move' | 'end';

interface ColumnGroupHeaderProps {
  colHeaderRenderer?: any; // do we use it ?
  columnGroup: ColumnGroup;
  groupState: GridModel["groupState"];
  height: number;
  ignoreHeadings?: boolean;
  onColumnMove: (phase: Phase, column: Column, distance?: number) => void;
  sortBy: GridModel["sortBy"];
  width: number;
}

type ColumnGroupHeaderComponent = React.ComponentType<ColumnGroupHeaderProps  & {ref?: any}>;

 type GridAction = 
  | {type: 'double-click', idx: number, row: any }
  | {type: 'scroll-start-horizontal', scrollLeft: number}
  | {type: 'scroll-end-horizontal', scrollLeft: number}
  | {type: 'selection', idx: number, row: any, rangeSelect: boolean, keepExistingSelection: boolean }
  | {type: 'select-cell', idx: number, columnKey: number}

  type GridActionHandler<T extends GridAction['type']> = 
  T extends 'double-click' ? (idx: number, row: any) => void :
  T extends 'scroll-start-horizontal' ? (scrollLeft: number) => void :
  T extends 'scroll-end-horizontal' ? (scrollLeft: number) => void :
  T extends 'selection' ? (idx: number, row: any, rangeSelect: boolean, keepExistingSelection: boolean) => void :
  T extends 'select-cell' ? (idx: number, columnKey: number) => void :
  never;

type GridActionHandlerMap = {[key in GridAction['type']]?: GridActionHandler<key>};  
type GridReducerFactory = (handlerMap: GridActionHandlerMap) => (state: {}, action: GridAction) => {};

type ScrollEvent = Extract<GridAction['type'],'scroll-start-horizontal' | 'scroll-end-horizontal'> | 'scroll-threshold';
type ScrollingCanvasHook = (
  scrollContainer: React.RefObject<HTMLDivElement>,
  scrollThreshold: number,
  callback: (scrollEvent: ScrollEvent, scrollLeft: number) => void,
  ) => (e: React.UIEvent<HTMLDivElement>) => void;

type GridContext = React.Context<{
    dispatch: Function;
    callbackPropsDispatch: (action: GridAction) => void;
    showContextMenu: any;
  }>;

//TODO define Actions
type DataReducer =[any, (any) => void];

type CanvasReducerState = [Column[], Map<number,number>];
type CanvasReducer = (state: [any, any], action: any) => CanvasReducerState;
type CanvasReducerInitializer = ({gridModel: GridModel, columnGroup: ColumnGroup}) => CanvasReducerState