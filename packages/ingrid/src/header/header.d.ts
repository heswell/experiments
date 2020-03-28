import React from 'react';
import {GridModel} from '../model/model';

export interface HeaderProps {
  className?: string;
  colGroupHeaderRenderer?: any;
  colHeaderRenderer?: any;
  height: number;
  ignoreHeadings?: boolean;
  model: GridModel;
  style?: object;
}

declare const Header: React.ComponentType<HeaderProps & {ref?: any}>;
export default Header; 
