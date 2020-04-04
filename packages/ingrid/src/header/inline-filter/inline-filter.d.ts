import React from 'react';
import {GridModel} from '../../model/model';
import {DataSource} from '@heswell/data';

export interface InlineFilterProps {
  dataSource: DataSource;
  height: number;
  model: GridModel;
  filter: any;
  style: any;
}

declare const InlineFilter: React.ComponentType<InlineFilterProps & {ref?: any}>;
export default InlineFilter; 
