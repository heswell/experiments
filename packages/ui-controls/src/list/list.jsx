import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import cx from 'classnames';
import * as StateEvt from '../state-machinery/state-events';
import * as Key from '../utils/key-code';
import {getKeyboardEvent} from '../utils/key-code';
import {searcher} from './searcher';

import './list.css';

const LIST_NAVIGATION_PATTERN = /^(home|end|page-up|page-down|down|up)$/
const isNavigationEvent = stateEvt => LIST_NAVIGATION_PATTERN.test(stateEvt.type);

export default forwardRef(function List(props, ref){
  const {
    hilitedIdx: propHilitedIdx=-1,
    onCancel,
    onCommit,
    selectedIdx=-1, // never seem to use it
    typeaheadListNavigation,
    values
  } = props;

  const listElement = useRef(null);
  const hilitedIdx = useRef(-1); // take value from prop ?
  const searchKeyHandler = useRef(typeaheadListNavigation ? searcher(values, setCurrentListItem) : null);

  useImperativeHandle(ref, () => ({ focus }));

  useEffect(() => {
    if (propHilitedIdx !== hilitedIdx.current){
      setCurrentListItem(propHilitedIdx)
    }
  },[propHilitedIdx]);

  function focus(){
    setCurrentListItem(0);
  }

  function setCurrentListItem(idx){
    if (hilitedIdx.current !== idx){
      const listItemElement = listElement.current.querySelector(`.list-item[data-idx = '${idx}']`)
      if (listItemElement){
        listItemElement.focus();
      }
      hilitedIdx.current = idx;
    }
  }

    //TODO should accept a prop that configures whether we support
  // typeahead navigation a la Select
  const handleKeyDown = e => {
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt){
      if (stateEvt === StateEvt.ESC){
        onCancel();
      } else if (stateEvt === StateEvt.ENTER){
        onCommit(values[hilitedIdx.current])
      } else if (isNavigationEvent(stateEvt)){
        e.stopPropagation();
        navigateSuggestions(e.keyCode)
      } else if (searchKeyHandler.current){
        searchKeyHandler.current(e);
      }
    } 
  }

  const navigateSuggestions = keyCode => {
    const idx = nextItemIdx(values, keyCode, hilitedIdx.current);
    setCurrentListItem(idx)
  }

  return values.length === 0 ? (
      <div className="empty-list">Empty List</div>
    ) : (
      <ul className='list' ref={listElement}>
      {values.map((value,idx) => (
        <li key={idx} 
          tabIndex={0}
          data-idx={idx}
          className={cx("list-item", {
            selected: idx === selectedIdx
          })}
          onKeyDown={handleKeyDown}
          onClick={() => onCommit(value)}>
          <span>{value}</span>
        </li>
      ))}
    </ul>
  )

})

function nextItemIdx(values, keyCode, idx){
  if (keyCode === Key.UP){
    if (!idx){
      return values.length-1;
    } else {
      return idx - 1;
    }
  } else {
    if (idx === null){
      return 0;
    } else if (idx === values.length-1){
      return 0;
    } else {
      return idx + 1;
    }
  }
}
