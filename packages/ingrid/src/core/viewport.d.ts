import React, {ReactElement} from 'react';
import {DataSource} from '@heswell/data-source';
import {GridModel} from '../model/model';
//TODO define Actions
export type DataReducer =[any, (any) => void];

export interface ViewportProps {
  dataSource: DataSource;
  columnHeaders?: ReactElement[];
  height: number;
  model: GridModel;
  onFilterChange: any;
  style: any;
}

export type ViewportComponent = React.ComponentType<ViewportProps>;
declare const Viewport: ViewportComponent;
export default Viewport;