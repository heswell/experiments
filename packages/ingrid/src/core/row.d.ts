import {Column, GridModel} from '../model/model';

export interface RowProps {
  idx: number;
  columns: Column[];
  gridModel: GridModel;
  row: any;
}

export type RowComponent = React.ComponentType<RowProps>;
declare const Row: RowComponent;
export default Row;