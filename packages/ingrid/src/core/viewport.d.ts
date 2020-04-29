import React, {ReactElement} from 'react';
import {DataSource} from '@heswell/data-source';
//TODO define Actions
export type DataReducer =[any, (any) => void];

export interface ViewportProps {
  columnHeaders?: ReactElement[];
  dataSource: DataSource;
  height: number;
  model: GridModel;
  onFilterChange: any;
  scrolling: boolean;
  style: any;
}

export type ViewportComponent = React.ComponentType<ViewportProps>;
declare const Viewport: ViewportComponent;
export default Viewport;