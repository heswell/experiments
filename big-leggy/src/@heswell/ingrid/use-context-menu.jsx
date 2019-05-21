import React, { useCallback } from 'react';
import { PopupService } from './services';
import GridContextMenu from './context-menu/grid-context-menu';
import * as Action from './model/actions';

export const useContextMenu = (model, state, setState, dispatch) => {

  const handleContextMenuAction = useCallback(action => {

    if (action === Action.TOGGLE_FILTERS) {
      setState(state => ({
        ...state,
        showFilters: state.showFilters === false
      }));
    }
    //  else if (action === 'hide-filters') {
    //   dispatch({ type: 'SAVE_CONFIG', config: { showFilters: false } });
    // }

  }, [state.showFilters]);

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
          showFilters: state.showFilters
        }}
        dispatch={dispatch}
        doAction={handleContextMenuAction}
      />)
      ;

    PopupService.showPopup({ left: Math.round(left), top: Math.round(top), component });

  },[model, state])


}

