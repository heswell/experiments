import React from 'react';
import { Column } from '../../model/model';
import { DataSource } from '@heswell/data-source';

interface ColumnFilterProps {
  column: Column;
  dataView: DataSource;
  filter: any;
  onClearFilter: (column: Column) => void;
  onFilterClose: () => void;
  onFilterOpen: (column: Column) => void;
  showFilter: boolean;
}

export type ColumnFilterComponent = React.ComponentType<ColumnFilterProps>;
declare const ColumnFilter: ColumnFilterComponent;
export default ColumnFilter;