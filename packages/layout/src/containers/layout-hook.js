import {stretchLoading} from '../model/stretch';
import layoutReducer, { initModel, Action } from '../model/layout-reducer';

import {useReducer} from 'react';

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
  const [layoutModel, dispatchLayoutAction] = useReducer(layoutReducer, {...initialData, layout: inheritedLayout.computedStyle}, initModel);

  if (layoutModel === null){
      stretchLoading.then(() => {
          dispatchLayoutAction({type: Action.INITIALIZE, ...initialData});
      });
  }

  return [layoutModel, dispatchLayoutAction];

}

export default useLayout;