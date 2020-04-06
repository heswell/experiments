
declare type rowData = "rowData";
declare type filterData = "filterData";
declare type filterBins = "filterBins";

export type DataType = filterData | rowData | filterBins;

export declare const DataTypes: {
  readonly ROW_DATA: rowData;
  readonly FILTER_DATA: filterData;
  readonly FILTER_BINS: filterBins;
}

export declare const ASC: "asc";
export declare const DSC: "dsc";

export type RowValue = 'string' | 'number' | 'boolean' | 'undefined';
export type Row = RowValue[];

export type ColumnMeta = {
  [key: string]: number
} 