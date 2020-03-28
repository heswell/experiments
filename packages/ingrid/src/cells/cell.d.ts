import {Column} from '../model/model';

export interface CellProps {
  idx: number;
  column: Column;
  meta: any;
  row: any;
  onClick: any;
}

declare const Cell: React.ComponentType<CellProps>;
export default Cell;