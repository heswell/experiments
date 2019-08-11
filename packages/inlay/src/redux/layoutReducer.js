import {LAYOUT_MODEL, DROP, LAYOUT_REMOVE, LAYOUT_SWITCH_TAB, LAYOUT_REPLACE} from './actions';

import {handleLayout} from '../model/index';

// Make sure we don't handle any layout actions before the layoutModel has
// been initialized

export default function layoutReducer(state=null, {type, ...action}){
	
	//onsole.log(`%clayoutReducer ${type} ${JSON.stringify(action)}` ,'color:white;background-color:green;font-weight:bold;');

    switch (type){

    case LAYOUT_MODEL: 	return action.layoutModel;
    
    case LAYOUT_REMOVE: return handleLayout(state, 'remove', action);

    case LAYOUT_REPLACE : return handleLayout(state, 'replace', action);
    
    case LAYOUT_SWITCH_TAB : return handleLayout(state, 'switch-tab', action);

    case DROP : return handleLayout(state, 'drop', action); 	
       
    default:  return state;

}


}

export const getLayoutModel = state => state.layoutModel;