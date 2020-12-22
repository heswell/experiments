import { createContext, useContext } from "react";

const ListItemContext = createContext();

export default ListItemContext;

export const useListItemContext = () => {
  const context = useContext(ListItemContext);

  if (context === undefined) {
    console.warn(
      "useListItemContext must be used inside of a List or ListBase component."
    );
  }

  return context;
};
