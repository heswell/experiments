import React from 'react';
import { SelectionProvider } from '@heswell/layout';
const DesignContext = React.createContext(true);
export default DesignContext;

export const DesignProvider = props => {

  const handleSelect = selectedItem => {
    console.log(`item selected`, selectedItem)
  }

  return (
    <SelectionProvider onSelect={handleSelect}>
      <DesignContext.Provider>
        {props.children}
      </DesignContext.Provider>
    </SelectionProvider>
  )
}


export const useDesignTime = () => {
  return useContext(DesignContext);
}
