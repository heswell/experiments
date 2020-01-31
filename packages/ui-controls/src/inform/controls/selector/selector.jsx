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
  value: propsValue, 
  ...props}, ref){

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
      console.log(`new value ${value} state.value ${state.value}`)
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

const onKeyDown = e => {
  const {keyCode} = e;
  const open = state.open;
  console.log(`[Selector] onKeyDown open=${open}`)
  if (keyCode === Key.ENTER){
    if (state.open && props.selectedIdx !== null){
      const val = availableValues[props.selectedIdx];
      this.commit(val);
    } else if (state.value !== state.initialValue){
      console.log(`selector ENTER state.value = '${state.value}' state.initialValue = '${state.initialValue}'`)
      this.commit();
    } else if (!open){
      console.log(`selector ENTR => open`)
      setState({...state, open: true})
    }
  } else if (keyCode === Key.ESC){
    onCancel();
  } else if (open && (keyCode === Key.UP || keyCode === Key.DOWN)){
    focusDropdown();
  } else if (props.onKeyDown){
    props.onKeyDown(e)
  }
}

const onBlur = () => {
  if (!ignoreBlur.current && state.value !== state.initialValue){
    console.log(`[Selector] onBlur => commit`)
    commit();
  }
}

const onFocus = () => {
  if (props.onFocus){
    props.onFocus();
  }
}

  const onClick = () => {
    if (!state.open){
      setState({...state, open: true});
    }
  }

  const onSelect = (val) => {
    commit(val);
  }

  const onCancel = () => {
    setState({
      ...state,
      value: state.initialValue,
      open: false
    }/*, () => {
      this.props.onPopupActive(false);
    }*/);
    props.onCancel()
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
    if (wasOpen && props.onPopupActive){
      props.onPopupActive(false);
    }
    props.onCommit(state.value);

    ignoreBlur.current = false;
  }

  const focusDropdown = () => {
    ignoreBlur.current = true;
    dropdown.current.focus();
    if (props.onPopupActive){
      props.onPopupActive(true);
    }
  }


  const {
    inputClassName,
    inputIcon = 'keyboard_arrow_down',
    dropdownClassName,
    children: childRenderer,
    onCommit: onChange
  } = props;

  const className = cx('control-text', inputClassName, {
    'dropdown-showing': state.open
  })

  const childComponent = typeof childRenderer === 'function'
    ? childRenderer(Selector.input)
    : null;

  const props2 = {
    onKeyDown,
    onBlur,
    onFocus,
    onClick,
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
      {...props2}
      ref={inputEl}
      type="text" 
      className={className}
      onChange={onChange}
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
          onCommit={onSelect}
          onCancel={onCancel}>
          {renderDropdownComponent()}
        </Dropdown>
      )}
    </>
  )

  function renderDropdownComponent(){
    const {children: childRenderer, typeaheadListNavigation} = props;
    const dropdown = typeof childRenderer === 'function'
      ? childRenderer(ComponentType.Dropdown)
      : null;

    return dropdown || (
      <List
        values={availableValues}
        selectedIdx={state.selectedIdx}
        hilitedIdx={props.hilitedIdx}
        typeaheadListNavigation={typeaheadListNavigation}
      />
    )

  }

})

