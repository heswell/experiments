import { useCallback, useReducer } from 'react';
import { stretchLoading } from '../model/stretch';
import layoutReducer, { initModel, Action } from '../model/layout-reducer';

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
const useLayout = (initialData, inheritedLayout = NULL_LAYOUT, dragEnabled) => {
  let { layoutModel, dispatch } = initialData.props;

  if (!layoutModel) {

    let dispatchLayoutAction;
    ([layoutModel, dispatchLayoutAction] = useReducer(layoutReducer, { ...initialData, layout: inheritedLayout.computedStyle }, initModel));

    dispatch = dragEnabled
      ? dispatchLayoutAction
      : useCallback(action => {
        if (action.type === 'drag-start') {
          // This is handled by the layout root. If layout root is present, context will be set.
          // If we are in this code path, there is no layout root, so draggable layout not supported.
        } else {
          dispatchLayoutAction(action);
        }
      }, [layoutModel]);

    if (layoutModel === null) {
      stretchLoading.then(() => {
        dispatch({ type: Action.INITIALIZE, ...initialData });
      });
    }

  }



  return [layoutModel, dispatch];

}

export default useLayout;