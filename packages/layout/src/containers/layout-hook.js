import {stretchLoading} from '../model/stretch';
import layoutReducer, { initModel, Action } from '../model/layout-reducer';
import {useContext, useReducer} from 'react';

const NULL_LAYOUT = {
  $id: undefined,
  children: undefined,
  computedStyle: undefined,
  layoutModel: undefined,
  props: undefined,
  style: undefined,
  type: undefined
}


/** @type {LayoutHook} */
const useLayout = (initialData, inheritedLayout=NULL_LAYOUT) => {
  let {layoutModel, dispatch} = initialData.props;

  if (!layoutModel){
    ([layoutModel, dispatch] = useReducer(layoutReducer, {...initialData, layout: inheritedLayout.computedStyle}, initModel));
  
    if (layoutModel === null){
      stretchLoading.then(() => {
          dispatch({type: Action.INITIALIZE, ...initialData});
      });
    }
  
  }

  return [layoutModel, dispatch];

}

export default useLayout;