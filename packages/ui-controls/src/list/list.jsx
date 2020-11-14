import React, { forwardRef, useEffect, useLayoutEffect, useState, useImperativeHandle, useRef } from 'react';
import cx from 'classnames';
import * as StateEvt from '../state-machinery/state-events';
import { getKeyboardEvent } from '../utils/key-code';
import { searcher } from './searcher';
import {useKeyboardNavigation} from './use-keyboard-navigation';

import './list.css';

export default forwardRef(function List(props, ref) {
  const {
    onCancel,
    onChange,
    onHighlight,
    hilitedIdx: hilitedIdxProp,
    selectedIdx: selectedIdxProp,
    typeaheadListNavigation,
    values
  } = props;

  const listElement = useRef(null);
  const scrollTop = useRef(0);
  const scrolling = useRef(false);
  const scrollHeight = useRef(0);
  const height = useRef(0);
  const searchKeyHandler = useRef(typeaheadListNavigation ? searcher(values, setCurrentListItem) : null);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const controlledSelection = selectedIdxProp !== undefined;
  const controlledHiliting = hilitedIdxProp !== undefined;

  //TODO should accept a prop that configures whether we support
  // typeahead navigation a la Select
  const listHandleKeyDown = e => {
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt) {
      if (stateEvt === StateEvt.ESC) {
        onCancel();
      } else if (stateEvt === StateEvt.ENTER) {
        selectItemAtIndex(hilitedIdx);
      } else if (searchKeyHandler.current) {
        searchKeyHandler.current(e);
      }
    }
  }

  // need a way to change highlightedIdx when selectedIdx changes
  // useEffect(() => {

  // },[selectedIdxProp])


  const {
    hilitedIdx, 
    hiliteItemAtIndex, 
    keyBoardNavigation, 
    handleBlur,
    handleFocus,
    handleKeyDown,
    setIgnoreFocus,

  } = useKeyboardNavigation({
    hilitedIdx: hilitedIdxProp,
    onHighlight,
    onKeyDown: listHandleKeyDown,
    selectedIdx,
    typeToNavigate: true,
    values
  })


  // TODO hook should manage controlled
  const hilited = controlledHiliting
  ? hilitedIdxProp
  : hilitedIdx;

  useEffect(() => {
    height.current = listElement.current.clientHeight;
    scrollHeight.current = listElement.current.scrollHeight;
  }, []);

  useLayoutEffect(() => {
    if (hilited !== -1 && scrollHeight.current > height.current) {
      const item = listElement.current.querySelector(`[data-idx='${hilited}']`);
      if (outsideViewport(item)) {
        scrollIntoView(item);
      }
    }
  }, [hilited])

  const outsideViewport = (el) => {
    const t = el.offsetTop;
    const h = el.offsetHeight;
    const viewportStart = scrollTop.current;
    const viewportEnd = viewportStart + height.current;
    if ((t + h) > viewportEnd) {
      return true;
    } else if (t < viewportStart) {
      return true
    } else {
      return false;
    }
  }

  const scrollIntoView = (el) => {
    const t = el.offsetTop;
    const h = el.offsetHeight;
    const viewportStart = scrollTop.current;
    const viewportEnd = viewportStart + height.current;
    scrollTop.current = (t + h) > viewportEnd
      ? scrollTop.current + (t + h) - viewportEnd
      : t;

      scrolling.current = true;
    listElement.current.scrollTop = scrollTop.current;
    setTimeout(() => {scrolling.current = false});
    console.log(`scroll into view)`)

  }


  function setCurrentListItem(idx) {
    const listItemElement = listElement.current.querySelector(`.list-item[data-idx = '${idx}']`)
    if (listItemElement) {
      listItemElement.focus();
    }
  }

  const handleItemClick = (evt, idx) => {
    selectItemAtIndex(idx);
  }

  const selectItemAtIndex = idx => {
    if (!controlledSelection) {
      setSelectedIdx(idx);
    }
    if (onChange) {
      onChange(idx);
    }
  }

  const handleListMouseDownCapture = evt => {
    keyBoardNavigation.current = false;
    setIgnoreFocus(true);
  }

  const handleListMouseEnter = evt => {
    keyBoardNavigation.current = false;
  }

  const handleListItemMouseEnter = (idx) => {
    if (!scrolling.current){
      hiliteItemAtIndex(idx)
    }
  }

  const handleListMouseLeave = evt => {
    keyBoardNavigation.current = true;
    setIgnoreFocus(false);
    console.log(`handleListMouseLeave`)
    hiliteItemAtIndex(-1);
  }

  const selected = controlledSelection
    ? selectedIdxProp
    : selectedIdx;

  const focusVisible =  (props.showFocusVisible || !controlledHiliting) 
    && keyBoardNavigation.current;

  return values.length === 0 ? (
    <div className="empty-list">Empty List</div>
  ) : (
      <div 
        className={cx('list', { focusVisible})} 
        ref={listElement} role="list"
        onBlur={handleBlur}
        onFocus={handleFocus}
        onMouseEnter={handleListMouseEnter}
        onMouseLeave={handleListMouseLeave}
        onMouseDownCapture={handleListMouseDownCapture}
        onKeyDown={handleKeyDown}
        tabIndex={0}>
        {values.map((value, idx) => (
          <div key={idx}
            role="list-item"
            data-idx={idx}
            className={cx("list-item", {
              selected: idx === selected,
              hilited: idx === hilited
            })}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => handleListItemMouseEnter(idx)}
            onClick={evt => handleItemClick(evt, idx)}>
            <span>{value}</span>
          </div>
        ))}
      </div>
    )

})
