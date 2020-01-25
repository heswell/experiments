import {stretchLoading} from '../model/stretch';
import layoutReducer, { initModel, Action } from '../model/layout-reducer';

import {useReducer} from 'react';

const EMPTY_OBJECT = {};

export default function useLayout(initialData, inheritedLayout=EMPTY_OBJECT){
  const [layoutModel, dispatchLayoutAction] = useReducer(layoutReducer, {...initialData, layout: inheritedLayout.computedStyle}, initModel);

  if (layoutModel === null){
      stretchLoading.then(() => {
          dispatchLayoutAction({type: Action.INITIALIZE, ...initialData});
      });
  }

  return [layoutModel, dispatchLayoutAction];

}
