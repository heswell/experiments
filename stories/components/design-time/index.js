import {useContext} from 'react';
import DesignContext from './design-time-context'; 
export {default as Toolbar} from './Toolbar.jsx';

export const DesignProvider = DesignContext.Provider;

export const useDesignTime = () => {
  return useContext(DesignContext);
}
