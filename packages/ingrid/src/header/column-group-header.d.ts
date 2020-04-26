import React from 'react';
import { Column, ColumnGroup, GridModel } from "../model/model";
import { Phase } from './header-cell';

interface ColumnGroupHeaderProps {
  colHeaderRenderer?: any; // do we use it ?
  columnGroup: ColumnGroup;
  ignoreHeadings?: boolean;
  model: GridModel;
  onColumnMove: (phase: Phase, column: Column, distance?: number) => void;
  style?: React.CSSProperties;
}

export type ColumnGroupHeaderComponent = React.ComponentType<ColumnGroupHeaderProps  & {ref?: any}>;

declare const ColumnGroupHeader: ColumnGroupHeaderComponent;

export default ColumnGroupHeader;
