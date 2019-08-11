import React, { useCallback } from 'react';
import { PopupService } from './services/index';
import GridContextMenu from './context-menu/grid-context-menu.jsx';
import * as Action from './model/actions';

export const useContextMenu = (model, showFilters, setShowFilters, dispatch) => {

  const handleContextMenuAction = useCallback(action => {

    if (action === Action.TOGGLE_FILTERS) {
      setShowFilters(state =>  !state);
    }
  }, [showFilters]);

  return useCallback((e, location, options) => {

    e.preventDefault();
    e.stopPropagation();

    const { clientX: left, clientY: top } = e;
    const component = (
      <GridContextMenu
        location={location}
        options={{
          ...options,
          model,
          showFilters
        }}
        dispatch={dispatch}
        doAction={handleContextMenuAction}
      />)
      ;

    PopupService.showPopup({ left: Math.round(left), top: Math.round(top), component });

  },[model, showFilters])


}

