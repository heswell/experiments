import { createContext, useContext } from "react";

const ListStateContext = createContext();

export default ListStateContext;

export const useListStateContext = () => {
  const context = useContext(ListStateContext);

  if (!context) {
    console.warn(
      "useListStateContext must be used inside of a ListStateContext Provider."
    );
  }

  return context;
};
