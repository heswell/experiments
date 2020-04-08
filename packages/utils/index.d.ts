export declare class EventEmitter<Events> {
  on: <E extends keyof Events>(event: E, callback: (E, arg: Events[E]) => void) => void; 
  emit: <E extends keyof Events>(event: E, arg?: Events[E], ...args: any[]) => void;
}

export declare const createLogger: any;
export declare const logColor: any;

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
export declare const extendsFilter: any;
export declare const extractFilterForColumn: any;
export declare const functor: any;
export declare const overrideColName: any;
export declare const splitFilterOnColumn: any;
export declare const IN: any;
export declare const NOT_IN: any;
export declare const BIN_FILTER_DATA_COLUMNS: any;
export declare const SET_FILTER_DATA_COLUMNS: any;

