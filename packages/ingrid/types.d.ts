
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
  locked: boolean;
  renderLeft: number;
  renderWidth: number;
  width: number;
}

interface CanvasProps {
  columnGroup: ColumnGroup;
  contentHeight: number;
  firstVisibleRow: number;
  gridModel: any;
  height: number;
  rows: any[];
}

type CanvasComponent = (props: CanvasProps, ref: React.RefObject<any>) => JSX.Element;

