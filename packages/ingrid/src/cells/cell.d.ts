import React from 'react';
import {Column} from '../model/model';

export interface CellProps {
  column: Column;
  meta: any;
  row: any;
  onClick?: (columnIndex: number) => void;
}

export type CellComponent = React.ComponentType<CellProps>;
declare const Cell: CellComponent;
export default Cell;