import React, { useCallback, useContext } from "react";
import { Action } from "./layout-action";

const ViewContext = React.createContext({});

export default ViewContext;

export const useViewContext = () => {
  const context = useContext(ViewContext);
  return context;
};

export const useViewAction = () => {
  const { dispatch } = useContext(ViewContext);
  return dispatch;
};

export const useViewActionDispatcher = (root, path, dispatch) => {
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
        dragRect
      });
    },
    [dispatch, path, root]
  );

  return dispatchAction;
};
