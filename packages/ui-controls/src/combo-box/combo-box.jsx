import React, {forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import Selector from '../select-base/select-base';

import './combo-box.css';

const defaultValues = [
  "Java",
  "Javascript",
  "Julia",
  "Perl",
  "Pascal",
  "PHP",
  "Python",
  "Ruby"
];

export default forwardRef(function ComboBox(props, ref){

  const {
    values=defaultValues,
    value=''
  } = props;

  const selector = useRef(null);
  const [state, setState] = useState({value, values});

  useImperativeHandle(ref, () => ({ focus }));

  // need to useEffect to detect value change from props

  function focus(){
    if (selector.current){
      selector.current.focus(false)
    }
  }

  const handleChange = e => {
    const value = e.target.value;
    const values = matchingValues(value)
    setState({
      value,
      values
    })
  }

  const matchingValues = value => {
    const pattern = new RegExp(`^${value}`,'i')
    return values.filter(value => pattern.test(value))
  }

  return (
    <Selector ref={selector}
      {...props}
      value={state.value}
      values={state.values}
      onChange={handleChange}
      inputClassName="combo-input"/>
  );

})
