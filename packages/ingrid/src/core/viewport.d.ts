import {GridModel} from '../model/model';
//TODO define Actions
export type DataReducer =[any, (any) => void];

export interface ViewportProps {
  dataView: any;
  height: number;
  model: GridModel;
  onFilterChange: any;
  style: any;
}

declare const Viewport: React.ComponentType<ViewportProps>;
export default Viewport;