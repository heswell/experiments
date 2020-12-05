import React from "react";
import { useId } from "../utils";
const Context = React.createContext(null);

export default function TabContext(props) {
  const { children, value } = props;
  const idStem = useId(props.id);

  const context = React.useMemo(() => {
    return { idStem, value };
  }, [idStem, value]);

  return <Context.Provider value={context}>{children}</Context.Provider>;
}
