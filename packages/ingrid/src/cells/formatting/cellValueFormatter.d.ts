import { Column } from "../../model/model";

export interface RenderCellProps {
  column: Column;
  row: any;
}

export type CellValueFormatter = (props: RenderCellProps) => string;

export declare const renderCellContent: CellValueFormatter;
