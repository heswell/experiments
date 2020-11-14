import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import * as Key from '../../utils/key-code';

const TextInput = forwardRef(function TextInput (props, ref){

  const inputEl = useRef(null);
  const [state, setState] = useState({
    value: props.initialValue || props.value || '',
    initialValue: props.initialValue || ''
  })

  useImperativeHandle(ref, () => ({focus }));

  const focus = () => {
    if (inputEl.current){
      inputEl.current.focus();
      inputEl.current.select();
    }
  }


  const handleFocus = () => {
    if (props.onFocus){
      props.onFocus()
    }
  }

  const handleChange = (e) => {
    setState({
      ...state,
      value: e.target.value
    });
  }

  const handleKeyDown = (e) => {
    const {keyCode} = e;
    if (keyCode === Key.ENTER){
      commit();
    } else if (keyCode === Key.ESC){
      setState({
        ...state,
        value: state.initialValue
      });
    }
  }

  const handleBlur = () => {
    if (state.value !== state.initialValue){
      commit();
    }
  }

  const commit = () => {
    setState({
      ...state,
      initialValue: state.value
    })
    props.onCommit(state.value);
  }

  return (
    <input
      ref={inputEl}
      type="text" 
      className="control-text"
      value={state.value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onFocus={handleFocus}
    />
  )

})

export default TextInput;