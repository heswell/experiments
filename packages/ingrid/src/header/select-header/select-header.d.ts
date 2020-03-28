// lets define stats here for now
export interface Stats {
  filteredRowCount: number;
  filteredSelected: number;
}

export interface SelectHeaderProps {
  dataView: any;
  style: any;
}

declare const SelectHeader: React.ComponentType<SelectHeaderProps & {ref?: any}>;
export default SelectHeader;