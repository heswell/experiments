import React, { forwardRef, useEffect, useLayoutEffect, useState, useRef } from 'react';
import cx from 'classnames';
import * as StateEvt from '../state-machinery/state-events';
import { getKeyboardEvent } from '../utils/key-code';
import { searcher } from './searcher';
import { useKeyboardNavigation } from './use-keyboard-navigation';
import ListItem from "./list-item";

import './list.css';

const List = forwardRef(function List({
  children,
  onCancel,
  onChange,
  onHighlight,
  hilitedIdx: hilitedIdxProp,
  selectedIdx: selectedIdxProp,
  showFocusVisible,
  typeaheadListNavigation,
  values,
  ...props
}, ref) {

  const listElement = useRef(null);
  const scrollTop = useRef(0);
  const scrolling = useRef(false);
  const scrollHeight = useRef(0);
  const height = useRef(0);
  const searchKeyHandler = useRef(typeaheadListNavigation ? searcher(values, setCurrentListItem) : null);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const controlledSelection = selectedIdxProp !== undefined;
  const controlledHiliting = hilitedIdxProp !== undefined;

  const count = values?.length ?? React.Children.count(children);  

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
    count,
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
    setTimeout(() => { scrolling.current = false });
    console.log(`scroll into view)`)

  }


  function setCurrentListItem(idx) {
    const listItemElement = listElement.current.querySelector(`.list-item[data-idx = '${idx}']`)
    if (listItemElement) {
      listItemElement.focus();
    }
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

  const handleListItemClick = (evt, idx) => {
    selectItemAtIndex(idx);
  }

  const handleListItemMouseEnter = (evt, idx) => {
    if (!scrolling.current) {
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

  const focusVisible = (showFocusVisible || !controlledHiliting)
    && keyBoardNavigation.current;

  return (
    <div {...props}
      className={cx('list', { focusVisible, "empty-list": count === 0 })}
      ref={listElement}
      role="list"
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseEnter={handleListMouseEnter}
      onMouseLeave={handleListMouseLeave}
      onMouseDownCapture={handleListMouseDownCapture}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      >

      {React.Children.count(children) > 0 ? (
        React.Children.map(children, (child,idx) => 
          React.cloneElement(child, {
            idx,
            isHighlighted: idx === hilited,
            isSelected: idx === selected,
            onMouseEnter: handleListItemMouseEnter,
            onClick: handleListItemClick  
            })
        )
      ) : (values.map((value, idx) => (
        <ListItem
          idx={idx}
          key={idx}
          isHighlighted={idx === hilited}
          isSelected={idx === selected}
          onMouseEnter={handleListItemMouseEnter}
          onClick={handleListItemClick} 
          >
          <span>{value}</span>
          </ListItem>
      )))}
    </div>
  )

});

List.displayName = "List"
export default List;
