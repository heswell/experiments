import { useEffect, useRef, useState } from 'react';
import { getKeyboardEvent } from '../utils/key-code';
import * as StateEvt from '../state-machinery/state-events';

import * as Key from '../utils/key-code';
import {searcher} from './searcher';

  // onKeyDown={searchKeyHandler}

const LIST_NAVIGATION_PATTERN = /^(home|end|page-up|page-down|down|up)$/
const isNavigationEvent = stateEvt => LIST_NAVIGATION_PATTERN.test(stateEvt.type);
const isCharacter = stateEvt => stateEvt === StateEvt.TEXT;  

// we need a way to set highlightedIdx when selection changes
export const useKeyboardNavigation = ({
  highlightedIdx: highlightedIdxProp,
  onFocus,
  onHighlight,
  onKeyDown,
  selectedIdx=-1,
  typeToNavigate,
  values
}) => {
  const controlledHiliting = highlightedIdxProp !== undefined;
  const [hilitedIdx, setHilitedIdx] = useState(highlightedIdxProp);
  // does this belong here or should it be a method passed in?
  const keyBoardNavigation = useRef(true);
  const ignoreFocus = useRef(false);
  const setIgnoreFocus = value => ignoreFocus.current = value;

  useEffect(() => {
    setHilitedIdx(-1);
  },[values]);

  const handleKeyDown = e => {
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt && isNavigationEvent(stateEvt)) {
      e.preventDefault();
      e.stopPropagation();
      keyBoardNavigation.current = true;
      navigateSuggestions(e.keyCode)
    } else if (typeToNavigate && isCharacter(stateEvt)){
      searchKeyHandler(e);
    } else if (onKeyDown) {
      onKeyDown(e);
    }
  }

  const searchKeyHandler = typeToNavigate 
    ? searcher(values, setHilitedIdx)
    : null;
   
  
  const handleBlur = evt => {
    setHilitedIdx(-1);
  }

  const handleFocus = evt => {
    if (ignoreFocus.current) {
      ignoreFocus.current = false;
    } else if (selectedIdx !== -1) {
      setHilitedIdx(selectedIdx);
    } else {
      setHilitedIdx(0);
    }

    if (onFocus){
      onFocus();
    }
  }

  const hiliteItemAtIndex = idx => {
    if (!controlledHiliting) {
      setHilitedIdx(idx);
    }
    if (onHighlight) {
      onHighlight(idx);
    }
  }

  const navigateSuggestions = keyCode => {
    hiliteItemAtIndex(nextItemIdx(values, keyCode, hilitedIdx))
  }
  
  const hilited = controlledHiliting
  ? hilitedIdxProp
  : hilitedIdx;


  return {
    hilitedIdx: hilited,
    hiliteItemAtIndex,
    keyBoardNavigation,
    handleBlur,
    handleFocus,
    handleKeyDown,
    setIgnoreFocus
  };
}

// need to be able to accommodate disabled items
function nextItemIdx(values, keyCode, idx) {
  if (keyCode === Key.UP) {
    if (idx > 0) {
      return idx - 1;
    } else {
      return idx;
    }
  } else {
    if (idx === null) {
      return 0;
    } else if (idx === values.length - 1) {
      return idx;
    } else {
      return idx + 1;
    }
  }
}
