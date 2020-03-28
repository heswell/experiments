import {Column} from '../model/model';

export interface GroupCellProps {
  idx: number;
  column: Column;
  meta: any;
  row: any;
  onClick: any;
}

declare const GroupCell: React.ComponentType<GroupCellProps>;
export default GroupCell;