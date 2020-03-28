import {Column, GridModel} from '../model/model';

export interface RowProps {
  idx: number;
  columns: Column[];
  gridModel: GridModel;
  row: any;
}

declare const Row: React.ComponentType<RowProps>;
export default Row;