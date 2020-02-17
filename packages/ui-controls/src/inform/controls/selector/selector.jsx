import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import cx from 'classnames';
import Dropdown from '../dropdown';
import List from '../list';
import * as Key from '../../../utils/key-code';

import './selector.css';

export const ComponentType = {
  Input : 'input',
  Dropdown : 'dropdown'
};

export default forwardRef(function Selector({
  availableValues,
  children: childRenderer,
  dropdownClassName,
  hilitedIdx,
  inputClassName,
  inputIcon = 'keyboard_arrow_down',
  onCancel,
  onChange,
  onCommit,
  onFocus,
  onKeyDown,
  onPopupActive,
  selectedIdx, // sort out confusion between this and state value
  typeaheadListNavigation,
  value: propsValue 
}, ref){

  const ignoreBlur = useRef(false);
  const inputEl = useRef(null);
  const dropdown = useRef(null);

  const value = propsValue === null ? '' : propsValue;  

  useEffect(() => {
    if (inputEl.current){
      const {top, left, width, height} = inputEl.current.getBoundingClientRect();
      setState({...state, position: {top,left,width,height}});
    }
  },[]);

  // untested
  useEffect(() => {
    if (value !== state.value){
      console.log(`new value state.value ${state.value}`, value)
      setState({...state, value, selectedIdx: availableValues.indexOf(value)})
    }
  },[value, availableValues])

  const [state, setState] = useState({
    open: false,
    value: value || '',
    initialValue: value || '',
    selectedIdx: availableValues.indexOf(value),
    position: null
});

useImperativeHandle(ref, () => ({
  focus: (selectText=true) => {
    if (inputEl.current){
      inputEl.current.focus();
      if (selectText){
        inputEl.current.select();
      }
    }
  }
}));

const focusDropdown = () => {
  ignoreBlur.current = true;
  dropdown.current.focus();
  if (onPopupActive){
    onPopupActive(true);
  }
}

const handleChange = evt => {
  if (!state.open){
    setState({...state, open: true})
  }
  onChange(evt);
}

const handleKeyDown = e => {
  const {keyCode} = e;
  const open = state.open;
  console.log(`[Selector] onKeyDown open=${open}`)
  if (keyCode === Key.ENTER){
    if (state.open && selectedIdx !== null){
      const val = availableValues[selectedIdx];
      commit(val);
    } else if (state.value !== state.initialValue){
      console.log(`selector ENTER state.value = '${state.value}' state.initialValue = '${state.initialValue}'`)
      commit();
    } else if (!open){
      console.log(`selector ENTR => open`)
      setState({...state, open: true});
    }
  } else if (keyCode === Key.ESC){
    if (open){
      setState({...state, open: false});
    }
    onCancel();
  } else if (open && (keyCode === Key.UP || keyCode === Key.DOWN)){
    focusDropdown();
  } else if (onKeyDown){
    onKeyDown(e)
  }
}

const handleFocus = _evt => {
  console.log(`[Selector.input] handleFocus => onFocus`)
  onFocus();
}

const handleBlur = () => {
  console.log(`[Selector.input] handleBlur ignoreBlur = ${ignoreBlur.current} ${state.value}`)
  if (!ignoreBlur.current && state.value !== state.initialValue){
    console.log(`[Selector.input] handleBlur => commit`)
    commit();
  }
}

const handleClick = () => {
  console.log(`[Selector.input] handleClick (open=${state.open})`)
  if (!state.open){
      console.log(`\t...open`)
      setState({...state, open: true});
    }
  }

  const handleCommit = (val) => {
    commit(val);
  }

  // this just means dropdown has closed without selection, do we really need to cancel anuthing ?
  // only if ESC was pressed ?
  const handleCancel = () => {
    setState({
      ...state,
      //value: state.initialValue,
      open: false
    });
    //onPopupActive(false);
    //onCancel()
  }

  const commit = (value=state.value) => {
    const wasOpen = state.open;
    setState({
      ...state,
      open: false,
      value: value,
      initialValue: value
    });

    // previously this was in setSTate callback
    if (wasOpen && onPopupActive){
      onPopupActive(false);
    }
    onCommit(state.value);

    ignoreBlur.current = false;
  }

  const className = cx('control-text', inputClassName, {
    'dropdown-showing': state.open
  })

  const childComponent = typeof childRenderer === 'function'
    ? childRenderer(ComponentType.Input)
    : null;

  const props = {
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
    ? React.cloneElement(childComponent, props)
    : (
    <input
      {...props}
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
          position={state.position}
          onCommit={handleCommit}
          onCancel={handleCancel}>
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
        values={availableValues}
        selectedIdx={state.selectedIdx}
        hilitedIdx={hilitedIdx}
        typeaheadListNavigation={typeaheadListNavigation}
      />
    )

  }

})

