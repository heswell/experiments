import { useEffect, useRef, useState } from "react";
import layoutReducer from "./layout-reducer";
import { applyLayout } from "./layoutUtils"; // TODO allow props to specify layoutRoot
import useNavigation from "./layout-hooks/useLayoutNavigation";

/**
 * Root layout node will never receive dispatch. It may receive a layoutModel,
 * in which case UI will be built from model. Only root stores layoutModel in
 * state and only root updates layoutModel. Non-root layout nodes always return
 * layoutModel from props. Root node, if seeded with layoutModel stores this in
 * state and subsequently manages layoutModel in state.
 */
const useLayout = (layoutType, props, customDispatcher) => {
  const isRoot = props.dispatch === undefined;
  const ref = useRef(null);
  // Only the root layout actually stores state here
  const state = useRef(undefined);
  // AKA forceRefresh
  const [, setState] = useState(0);
  const layout = useRef(props.layout);

  customDispatcher = useNavigation(
    layoutType,
    props,
    customDispatcher,
    ref,
    state
  );

  const dispatchLayoutAction = useRef(
    props.dispatch ||
      ((action) => {
        // A custom dispatcher should return true to indicate that it has handled this action.
        // A custom dispatcher alone will not refresh the layout state, it must ultimately
        // dispatch a  layout action that will be handled below.It can be used to defer an action
        // that has async pre-requisites or initiate an operation that may or may not progress
        // to actual layour re-render e.g layout drag drop.
        if (customDispatcher && customDispatcher(action)) {
          return;
        }

        const nextState = layoutReducer(state.current, action);
        if (nextState !== state) {
          state.current = nextState;
          setState((c) => c + 1);
          if (props.onLayoutChange) {
            // TODO serialize layout
            // TODO we have a circular deopendency in tree after a drag-start
            //props.onLayoutChange(layoutToJSON(layoutType, props, nextState));
          }
        }
      })
  );

  // Detect dynamic layout reset from serialized layout
  useEffect(() => {
    if (props.layout !== layout.current) {
      state.current = applyLayout(
        layoutType,
        props,
        dispatchLayoutAction.current
      );
      setState((c) => c + 1);
      layout.current = props.layout;
    }
  }, [layoutType, props]);

  if (isRoot && state.current === undefined) {
    state.current = applyLayout(
      layoutType,
      props,
      dispatchLayoutAction.current
    );
  }

  return isRoot
    ? [state.current, dispatchLayoutAction.current, ref]
    : [props, props.dispatch, ref];
};

export default useLayout;
