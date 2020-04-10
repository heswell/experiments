export declare class EventEmitter<Events> {
  on: <E extends keyof Events>(event: E, callback: (E, arg: Events[E]) => void) => void; 
  emit: <E extends keyof Events>(event: E, arg?: Events[E], ...args: any[]) => void;
}

export declare const createLogger: any;
export declare const logColor: any;

// array
export declare const partition: any;

// we need column definition
export declare const metaData: (columns: any) => {[key: string] : number}
export declare const buildColumnMap: any;
export declare const toColumn: any;
export declare const getFilterType: any;
export declare const mapSortCriteria: any;
export declare const projectColumns: any;
export declare const projectColumnsFilter: any;
export declare const setFilterColumnMeta: any;
export declare const toKeyedColumn: any;

// filter
export declare const addFilter: any;
export declare const AND: 'AND';
export declare const BIN_FILTER_DATA_COLUMNS: any;
export declare const EQUALS: 'EQ';
export declare const extendsFilter: any;
export declare const extractFilterForColumn: any;
export declare const functor: any;
export declare const GREATER_EQ: 'GE';
export declare const GREATER_THAN: 'GT';
export declare const IN: 'IN';
export declare const includesColumn: any;
export declare const includesNoValues: any;
export declare const LESS_EQ: 'LE';
export declare const LESS_THAN: 'LT';
export declare const NOT_IN: any;
export declare const NOT_STARTS_WITH: 'NOT_SW';
export declare const OR: 'OR';
export declare const overrideColName: any;
export declare const splitFilterOnColumn: any;
export declare const SET_FILTER_DATA_COLUMNS: any;
export declare const STARTS_WITH: 'SW';

// range
export declare const getFullRange: any;

// sort
export declare const sortByToMap: any;

// group
export declare const indexOfCol: any;
export declare const updateGroupBy: any;

// constants
export declare const ASC: "asc";
export declare const DSC: "dsc";

type DataTypes = {
  readonly ROW_DATA: 'rowData',
  readonly FILTER_DATA: 'filterData',
  readonly FILTER_BINS: 'filterBins'
}
export declare const DataTypes: DataTypes;