import React, {forwardRef, useEffect, useMemo, useImperativeHandle, useRef, useState } from 'react';
import cx from 'classnames';
import Dropdown from '../dropdown';
import List from '../list';
import * as Key from '../utils/key-code';
import {useKeyboardNavigation} from '../list/use-keyboard-navigation';

import './select-base.css';

export const ComponentType = {
  Input : 'input',
  Dropdown : 'dropdown'
};

const defaultValueFormatter = values => idx => values[idx];  

export default forwardRef(function Selector({
  values,
  children: childRenderer,
  dropdownClassName,
  inputClassName,
  inputIcon = 'keyboard_arrow_down',
  onCancel,
  onChange,
  onCommit,
  onFocus: onFocusProp,
  onPopupActive,
  showDropdownOnEdit=true,
  typeToNavigate,
  value: propsValue,
  valueFormatter,

}, ref){

  const inputEl = useRef(null);
  const dropdown = useRef(null);
  const formatValue = useMemo(() => valueFormatter || defaultValueFormatter(values),[valueFormatter, values])
  
  const {
    hilitedIdx, 
    handleFocus,
    handleKeyDown: onKeyDown,
  } = useKeyboardNavigation({
    onFocus: onFocusProp,
    selectedIdx: values.indexOf(value),
    typeToNavigate,
    values
  });


  const value = propsValue === null ? '' : propsValue;  

  useEffect(() => {
    if (inputEl.current){
      const {top, left, width, height} = inputEl.current.getBoundingClientRect();
      setState(prevState => ({...prevState, position: {top,left,width,height}}));
    }
  },[]);

  // untested
  useEffect(() => {
    if (value !== state.value){
      console.log(`[Selector] useEffect<value, values> state.value ${state.value} props.value ${value}`)
      setState(prevState => ({...prevState, value: value ?? '', selectedIdx: values.indexOf(value)}))
    }
  },[value, values])

  const [state, setState] = useState({
    open: false,
    value: value || '',
    initialValue: value || '',
    selectedIdx: values.indexOf(value),
    position: null
});

useImperativeHandle(ref, () => ({ focus }));

const focus = (selectText=true) => {
  if (inputEl.current){
    inputEl.current.focus();
    if (selectText){
      inputEl.current.select();
    }
  }
}

const focusDropdown = () => {
  try {
    dropdown.current.focus();
    if (onPopupActive){
      onPopupActive(true);
    }
  } catch {

  }
}

const handleChange = evt => {
  if (!state.open && showDropdownOnEdit){
    setState({...state, open: true})
  }
  onChange(evt);
}

// The selection Logic all belongs in selection hook
const handleKeyDown = e => {
  const {keyCode} = e;
  const open = state.open;
  if (keyCode === Key.ENTER){
    if (state.open && hilitedIdx !== null){
      const val = values[hilitedIdx];
      commit(val);
    } else if (state.value !== state.initialValue){
      commit();
    } else if (!open){
      setState({...state, open: true});
      if (onPopupActive){
        onPopupActive(true);
      }
    }
  } else if (keyCode === Key.ESC){
    if (open){
      setState({...state, open: false});
      if (onPopupActive){
        onPopupActive(false);
      }
    }
    onCancel();
  } /* else if (open && (keyCode === Key.UP || keyCode === Key.DOWN)){
    focusDropdown();
  } */ else if (onKeyDown){
    onKeyDown(e)
  } else {
    console.log(`no handler`)
  }
}

const handleBlur = () => {
  if (state.value !== state.initialValue){
//    commit();
  }
}

const handleClick = () => {
  if (!state.open){
      setState({...state, open: true});
      if (onPopupActive){
        onPopupActive(true);
      }
    }
  }

  const handleCommit = value => {
    commit(formatValue(value));
    // Is it safe to do this every commit or should be only do it when user
    // has clicked a list item ?
    focus(false);
  }

  // this just means dropdown has closed without selection, do we really need to cancel anuthing ?
  // only if ESC was pressed ?
  const handleDropdownCancel = () => {
    setState({
      ...state,
      open: false
    });
    if (onPopupActive){
      onPopupActive(false);
    }
  focus(false);
  }

  const commit = (value=state.value) => {
    const wasOpen = state.open;
    setState({
      ...state,
      open: false,
      value: value,
      initialValue: value,
      selectedIdx: values.indexOf(value)
    });

    // previously this was in setSTate callback
    if (wasOpen && onPopupActive){
      onPopupActive(false);
    }

    if (onCommit){
      onCommit(value);
    }

  }

  const className = cx('control-text', inputClassName, {
    'dropdown-showing': state.open
  })

  const childComponent = typeof childRenderer === 'function'
    ? childRenderer(ComponentType.Input)
    : null;

  const inputProps = {
    ref: inputEl,
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    onFocus: handleFocus,
    onClick: handleClick,
    className: cx("control-text", inputClassName, 
    childComponent ? childComponent.props.className : null,
    {
      'dropdown-showing': state.open
    })
  }

  const controlText = childComponent 
    ? React.cloneElement(childComponent, inputProps)
    : (
    <input
      {...inputProps}
      type="text" 
      className={className}
      onChange={handleChange}
      value={state.value}
    />
  );

  return (
    <>
      {controlText}
      {inputIcon && <i className="control-icon material-icons">{inputIcon}</i>}
      {state.open && (
        <Dropdown ref={dropdown}
          className={dropdownClassName}
          componentName="List"
          inputEl={inputEl.current}
          listHeight={400}
          position={state.position}
          onCommit={handleCommit}
          onCancel={handleDropdownCancel}>
          {renderDropdownComponent()}
        </Dropdown>
      )}
    </>
  )

  function renderDropdownComponent(){
    const dropdown = typeof childRenderer === 'function'
      ? childRenderer(ComponentType.Dropdown)
      : null;

    return dropdown || (
      <List
        onChange={handleCommit}
        values={values}
        selectedIdx={state.selectedIdx}
        hilitedIdx={hilitedIdx}
        showFocusVisible
      />
    )

  }

})

