import { useCallback } from "react";
import { Action } from "./layout-action";

export const useViewActionDispatcher = (root, path, dispatch) => {
  // TODO should be event, action, then this method can bea assigned directly to a html element
  // as an event hander
  const dispatchAction = (action, evt) => {
    if (action === "close") {
      handleClose();
    } else if (action.type === "mousedown") {
      handleMouseDown(evt, action.index);
    } else if (Object.values(Action).includes(action.type)) {
      // relay layout action
      dispatch(action);
    }
  };

  const handleClose = () => {
    dispatch({ type: Action.REMOVE, path });
  };

  const handleMouseDown = useCallback(
    (evt, index) => {
      evt.stopPropagation();
      const dragRect = root.current.getBoundingClientRect();
      // TODO should we check if we are allowed to drag ?
      dispatch({
        type: Action.DRAG_START,
        evt,
        path: index === undefined ? path : `${path}.${index}`,
        dragRect,
      });
    },
    [dispatch, path, root]
  );

  return dispatchAction;
};
