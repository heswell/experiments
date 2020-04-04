import React from 'react';
import { Column, ColumnGroup, GridModel } from "../model/model";
import { Phase } from './header-cell';

interface ColumnGroupHeaderProps {
  colGroupHeaderRenderer?: any; // do we ever use it ?
  colHeaderRenderer?: any; // do we use it ?
  columnGroup: ColumnGroup;
  ignoreHeadings?: boolean;
  model: GridModel;
  onColumnMove: (phase: Phase, column: Column, distance?: number) => void;
}

export type ColumnGroupHeaderComponent = React.ComponentType<ColumnGroupHeaderProps  & {ref?: any}>;

declare const ColumnGroupHeader: ColumnGroupHeaderComponent;

export default ColumnGroupHeader;
