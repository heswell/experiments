import React from 'react';
import {GridModel} from '../model/model';

export interface InlineFilterProps {
  dataView: any;
  height: number;
  model: GridModel;
  filter: any;
  style: any;
}

declare const InlineFilter: React.ComponentType<InlineFilterProps & {ref?: any}>;
export default InlineFilter; 
