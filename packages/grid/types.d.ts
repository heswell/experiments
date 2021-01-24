declare module '@heswell/data-source';

type SelectionModel = 'checkbox' | 'single-row' | 'multi-row';
type SortDirection = 'asc' | 'dsc';

type GroupBy = Array<string | [string, SortDirection]>


interface ColumnDescriptor {
  locked?: boolean;
  name: string;
  width?: number;
}




type MetaDataKeys = {
  [key: string]: number;
}

type DataSource = any;


type GridContext = React.Context<{
  custom: any;
  dataSource: DataSource;
  dispatchGridAction: (action: GridAction) => void;
  dispatchGridModelAction: (action: GridModelAction) => void;
  gridModel: GridModel;
}>;




type GridAction = 
  | {type: 'scroll-start-horizontal', scrollLeft: number}
  | {type: 'scroll-end-horizontal', scrollLeft: number}
  | {type: 'selection', idx: number, row: any[], rangeSelect: boolean, keepExistingSelection: boolean}

type GridActionHandler<T extends GridAction['type']> = 
  T extends 'scroll-start-horizontal' ? (scrollLeft: number) => void :
  T extends 'scroll-end-horizontal' ? (scrollLeft: number) => void :
  T extends 'selection' ? (action: {idx: number, row: any[], rangeSelect: boolean, keepExistingSelection: boolean}) => void :
  never;

type True = true;

type GridActionHandlerMap = {[key in GridAction['type']]?: GridActionHandler<key>};  
type GridActionReducerFactory = (handlerMap: GridActionHandlerMap) => (state: {}, action: GridAction) => {};

// Grid Model Reducer and Actions


type Row = any;


type onHeaderCellDragHandler = (phase: 'drag-start', column: Column, columnPosition: number, mousePosition: number) => void;

type onColumnDragHandler = (phase: 'drag' | 'drag-end', column: Column, insertIdx?: number, insertPos?: number, columnLeft?: number) => void;
type onColumnDragStart = (phase: 'drag-start', columnGroupIdx: number, column: Column, columnPosition: number, mousePosition: number) => void;

interface ColumnGroupHeaderProps {
  columnGroup: ColumnGroup;
  columnGroupIdx: number;
  columns?: Column[];
  onColumnDragStart?: onColumnDragStart;
  ref?: React.RefObject<any>;
}
type ColumnGroupHeaderType = React.FC<ColumnGroupHeaderProps>;


interface HeaderCellProps {
  className?: string;
  column: Column;
  onDrag?: onHeaderCellDragHandler;
  onResize?: (resizePhase: ResizePhase, column: Column, width?: number) => void;
  sorted?: SortDirection | number;
}
type HeaderCellComponent = React.FC<HeaderCellProps>;

type RowsetRange = {
  hi: number;
  lo: number;
}

type RowKeys = {
  free: number[],
  used: {[key: number]: number}
}

type GridData = {
  bufferIdx: {lo: number, hi: number },
  buffer: any[],
  bufferSize: number,
  renderBufferSize: number,
  rows: any[];
  offset: number;
  rowCount: number;
  range: RowsetRange;
  keys: RowKeys,
  dataRequired: boolean
};

type DataAction = any;
type DataReducer = (state: GridData, action: DataAction) => GridData;


type CanvasAction =
  | {type: 'scroll-left', scrollLeft: number}
  | {type: 'refresh', columnGroup: ColumnGroup};

type CanvasReducerState = [Column[], Map<number,number>, ColumnGroup, number];
type CanvasReducer = (state: CanvasReducerState, action: CanvasAction) => CanvasReducerState;
type CanvasReducerInitializer = (ColumnGroup) => CanvasReducerState;

type Operation = any;

type Handle<T> = T extends React.ForwardRefExoticComponent<React.RefAttributes<infer T2>> ? T2 : never;

type CanvasRef = React.Ref<{
  beginHorizontalScroll: () => void;
  endHorizontalScroll: () => void;
  beginVerticalScroll: () => void;
  endVerticalScroll: (scrollTop: number) => void;
  beginDrag: (column: Column) => number;
  endDrag: (columnDragData: ColumnDragData, insertIdx: number) => void;
  isWithinScrollWindow: (column: Column) => boolean;
  scrollBy: (scrollLeft: number) => number;
  scrollLeft: number;
}>;


type CanvasHandle = Handle<CanvasType>;

interface RowProps {
  columns: Column[];
  height: number;
  idx: number;
  keys: any;
  onClick: (idx: number, row: any[], rangeSelect: boolean, keepExistingSelection: boolean) => void;
  row: Row;
  toggleStrategy: ToggleStrategy;
}

type RowType = React.FC<RowProps>;

interface CellProps {
  className?: string;
  column: Column;
  row: Row;
}

interface GroupCellProps extends CellProps {
  toggleStrategy: ToggleStrategy;
}

type CellType = React.FC<CellProps>;
type GroupCellType = React.FC<GroupCellProps>;

type ColumnBearerRef = React.RefObject<{
  setFinalPosition: () => void;
}>;

type ColumnDragData = {
  column: Column;
  columnGroupIdx: number;
  columnIdx: number;
  initialColumnPosition: number;
  columnPositions: [[number]];
  mousePosition: number;
}

interface ColumnBearerProps {
  columnDragData: ColumnDragData;
  gridModel: GridModel;
  /**
   * The initial scroll position of scrollable Canvas when Column drag begins.
   * (scroll position may subsequently be changed by column drag itself)
   */
  initialScrollPosition: number;
  onDrag?: onColumnDragHandler;
  onScroll: (scrollDistance: number) => number;
  ref: ColumBearerRef;
  rows: any[];
}
type ColumnBearerComponent = React.FC<ColumnBearerProps>;

interface DraggableProps {
  className?: string;
  onDrag: (e: React.MouseEvent, deltaX: number, deltaY: number) => void;
  onDragStart?: (e: React.MouseEvent) => any; //  what do we allow here ? Who uses it ?
  onDragEnd?: (e: React.MouseEvent, arg: any) => void;
}

type DraggableComponent = React.ComponentType<DraggableProps>;

type DragCallback = (phase: DragPhase, delta?: number, dragPosition?: number) => void;
type DragHook = (callback: DragCallback, dragPhase?: number, initialDragPosition?: number) => [React.MouseEventHandler<HTMLDivElement>, () => void];

type MenuDescriptor = {
  label: string;
  action: atring;
  children?: MenuDescriptor[];
}