import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {format, parseISO} from 'date-fns';
import Calendar from '../form/controls/calendar';
import SelectBase,  {ComponentType} from '../select-base/select-base';

import './date-picker.css';

const YYYY_DD_MM = 'yyyy-MM-dd';
const formatDate = date => format(date, YYYY_DD_MM);

const defaultValues = [
  "2018-12-18",
  "2018-12-19",
  "2018-12-20",
  "2018-12-21",
  "2018-12-22",
  "2018-12-23",
  "2018-12-24"
];

export default forwardRef(function DatePicker(props, ref){

  const {
    values = defaultValues,
    onCommit,
    value
  } = props;

  const selector = useRef(null);
  const [state, setState] = useState({values, value});

  useEffect(() => {
    if (value !== state.value){
      setState({...state, value })
    }
  },[value]);

  useImperativeHandle(ref, () => ({ focus }))

  function focus(){
    if (selector.current){
      selector.current.focus(false)
    }
  }

  const handleCommit = value => {
    onCommit(formatDate(parseISO(value)));
  }
  
  const handleChange = e => {
    const value = e.target.value;
    setState({ value, values: matchingValues(value) });
  }

  function matchingValues(text){
    const pattern = new RegExp(`^${text}`,'i')
    return values.filter(value => pattern.test(value))
  }

  return (
    <SelectBase ref={selector}
      {...props}
      value={state.value}
      values={state.values}
      onChange={handleChange}
      onCommit={handleCommit}
      valueFormatter={formatDate}
      inputClassName="date-input"
      inputIcon="date_range"
      dropdownClassName="date-picker-dropdown"
      showDropdownOnEdit={false}
    >
    {
      child =>
        child === ComponentType.Dropdown && (
          <Calendar
            value={state.value}>
            {formattedDate =>
              <span className="calendar-day">{formattedDate}</span>
            }
          </Calendar>
        )

    }
    </SelectBase>
  )

})
