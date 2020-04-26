
type FlashStyle = 'arrow' | 'bg-only' | 'arrow-bg';

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
  renderLeft: number;
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
  columns: Column[];
  contentHeight: number;
  displayWidth: number;
  groupBy: any;
  groupColumnWidth: number | 'auto';
  groupState: any;
  headerHeight: number;
  height: number;
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
  width: number;
  _columnDragPlaceholder: any;
  _groups: ColumnGroup[];
  _headingDepth: number;
  _headingResize: any;
  _movingColumn: any;
  _overTheLine: number;
}

interface CanvasProps {
  columnGroup: ColumnGroup;
  columnHeader?: React.ReactElement;
  firstVisibleRow: number;
  gridModel: GridModel;
  height: number;
  rows: any[];
  showHeaders?: boolean;
}

type CanvasComponent = (props: CanvasProps, ref: React.RefObject<any>) => JSX.Element;

 type GridAction = 
  | {type: 'double-click', idx: number, row: any }
  | {type: 'scroll-start-horizontal'}
  | {type: 'scroll-end-horizontal', scrollLeft: number}
  | {type: 'selection', idx: number, row: any, rangeSelect: boolean, keepExistingSelection: boolean }
  | {type: 'select-cell', idx: number, columnKey: number}

  type GridActionHandler<T extends GridAction['type']> = 
  T extends 'double-click' ? (idx: number, row: any) => void :
  T extends 'scroll-start-horizontal' ? () => void :
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
    dispatch: any;
    callbackPropsDispatch: any;
    showContextMenu: any;
  }>;

type CanvasReducerState = [Column[], Map<number,number>];
type CanvasReducer = (state: [any, any], action: any) => CanvasReducerState;
type CanvasReducerInitializer = ({gridModel: GridModel, columnGroup: ColumnGroup}) => CanvasReducerState