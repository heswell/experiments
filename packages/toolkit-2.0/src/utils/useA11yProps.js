import React, { useContext } from "react";

export const a11yContext = React.createContext({});

export default function useA11yProps() {
  return useContext(a11yContext);
}
