import React, { useContext } from "react";

const LayoutContext = React.createContext(null);

export const useLayoutDispatch = (dispatch) => {
  const layoutDispatch = useContext(LayoutContext);
  return dispatch ?? layoutDispatch;
};

export const LayoutProvider = ({ children, dispatch }) => {
  const parentDispatch = useLayoutDispatch();
  return (
    <LayoutContext.Provider value={dispatch ?? parentDispatch}>
      {children}
    </LayoutContext.Provider>
  );
};

export default LayoutContext;
