import ColumnBearer from "../core/column-bearer";

export type GridModelReducer = (state: GridModel, action: any) => GridModel;
export type ReducerTable = {[key: string]: GridModelReducer};