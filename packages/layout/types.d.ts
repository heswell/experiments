type ComponentRegistryEntry = [string, React.ComponentType<any>];
type ComponentRegistryList = ComponentRegistryEntry[];

type ComponentRegistryProvider = React.FC<{components?: ComponentRegistryList;}>;

type useComponentRegistry = (componentId: string, component?: React.FC) => React.FC | undefined;

type LayoutSelectionModel = 'single' | 'multtiple' | never;

interface LayoutProps {
  active?: number;
  dragStyle?: string;
  header?: {style?: unknown; menu?: boolean;};
  resizeable?: boolean;
  selectionModel?: LayoutSelectionModel;
  visibility?: string;
}

interface DragOperation {
  dragRect: unknown;
  dragPos: unknown;
  component: unknown;
  instructions: unknown;
}

type dragStart = 'drag-start';
type dragDrop = 'drag-drop';
type initializeLayout = 'initialize';
type removeLayout = 'remove';
type replaceLayout = 'replace';
type splitterResize = 'splitter-resize';
type switchTab = 'switch-tab';

type LayoutActions = {
  DRAG_START: dragStart;
  DRAG_DROP: dragDrop;
  INITIALIZE: initializeLayout;
  REMOVE: removeLayout;
  REPLACE: replaceLayout;
  SPLITTER_RESIZE: splitterResize;
  SWITCH_TAB: switchTab;
}

type LayoutAction = 
| {
  evt?: any; // used in tabstrip drag
  type: dragStart,
  layoutModel: LayoutModel,
  dragRect: unknown,
  dragPos?: unknown,
  instructions?: unknown }
 | {
  type: switchTab,
  path: string,
  nextIdx: number
 }
 | {
  type: removeLayout,
  layoutModel: LayoutModel
 }
 | {
  type: splitterResize,
  layoutModel: LayoutModel,
  dim: string,
  path: string,
  measurements: unknown
 };

interface LayoutModel extends LayoutProps {
  $id: string;
  $path: string;
  children: LayoutModel[];
  computedStyle?: React.CSSProperties;
  drag?: DragOperation;
  props: object;
  style: React.CSSProperties;
  title?: string;
  type: string;
}

type InitialData = {
  layoutType: string;
  props: any;
}

type layoutDispatcher = (action: LayoutAction) => void;
type LayoutHook = (initialData: InitialData, inheritedLayout?: LayoutModel, dragEnabled?: boolean) => [LayoutModel, layoutDispatcher]


type getLayoutModel = (type: string, props: unknown) => LayoutModel;

type getLayoutProps = (type: string, props: object) => LayoutProps;

interface LayoutComponentProps extends LayoutProps {
  className?: string;
  dispatch: layoutDispatcher;
  layoutModel: LayoutModel;
}

// Generics don't appear to work in JSDoc types
interface LayoutRootComponentProps {
  children: JSX.Element;
  layoutModel?: LayoutModel;
}


type LayoutRootComponent = (props: LayoutRootComponentProps) => JSX.Element;

interface TabbedContainerProps extends LayoutComponentProps {
  children: React.ReactNodeArray;
  onTabSelectionChanged: (tabIndex: number) => void;
}

type TabbedContainerComponent = (props: TabbedContainerProps) => JSX.Element;

interface FlexboxProps extends LayoutComponentProps {
  children: React.ReactNode;
  dropTarget?: boolean;
}

type FlexboxComponent = (props: FlexboxProps) => JSX.Element;
