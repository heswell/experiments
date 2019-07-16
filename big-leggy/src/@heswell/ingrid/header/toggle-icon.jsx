import React, {useContext} from 'react';
import * as Action from '../model/actions';
import GridContext from '../grid-context';

export default ({column}) => {

  const {dispatch} = useContext(GridContext);

  const handleToggleCollapse = () => {
    const action = column.collapsed ? Action.COLUMN_EXPAND : Action.COLUMN_COLLAPSE;
    dispatch({ type: action, column });
  }

  if (!column.collapsible || column.isHidden){
    return null;
  }

  return (
    <i className='material-icons toggle-icon' onClick={handleToggleCollapse}>{'arrow_right'}</i>
  );
}