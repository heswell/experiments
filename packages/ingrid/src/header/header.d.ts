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

export type HeaderComponent = React.ComponentType<HeaderProps & {ref?: any}>;
declare const Header: HeaderComponent;
export default Header; 
