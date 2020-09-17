import React, {useContext} from "react";
const layoutContext = React.createContext(null);
export default layoutContext;

export const useLayoutContext = () => {
  return useContext(layoutContext);
}
