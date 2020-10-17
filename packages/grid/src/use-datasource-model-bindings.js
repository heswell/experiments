import {GridModel} from './grid-model-utils';
import useEffectSkipFirst from './use-effect-skip-first';

export default function useDataSourceModelBindings(dataSource, gridModel){
  useEffectSkipFirst(() => {
    console.log('SORT changed')
    dataSource.sort(GridModel.sortBy(gridModel));
  },[dataSource, gridModel.sortColumns])

  // useEffectSkipFirst(() => {
  //   // undefined means these are unset, null means a previous value has been removed
  //   if (gridModel.groupColumns !== undefined || gridModel.pivotColumns !== undefined){
  //     dataSource.group(GridModel.groupBy(gridModel), GridModel.pivotBy(gridModel));
  //   }
  // },[dataSource, gridModel.groupColumns, gridModel.pivotColumns])

  useEffectSkipFirst(() => {
      dataSource.setGroupState(gridModel.groupState);
  }, [dataSource, gridModel.groupState]);

  useEffectSkipFirst(() => {
    dataSource.setSubscribedColumns(gridModel.columnNames);
}, [dataSource, gridModel.columnNames]);

}