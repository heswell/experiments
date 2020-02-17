import React from 'react';
import {format, parseISO} from 'date-fns';
import Calendar from '../calendar';
import Selector,  {ComponentType} from '../selector/selector';

import './date-picker.css';

const formatDate = value => format(value,'yyyy-MM-dd');

export default class DatePicker extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      open: false,
      value: this.props.value || '',
      initialValue: this.props.value,
      values: props.availableValues
    }
    this.selector = React.createRef();
    this.onChange = this.onChange.bind(this);
    this.onCommit = this.onCommit.bind(this);

  }

  componentWillReceiveProps(nextProps){
    if (nextProps.value !== this.props.value){
      console.log(`DatePickerr componentWillReceiveProps ${nextProps.value}`)
      this.setState({
        value: nextProps.value
      })
    }
  }

  focus(){
    if (this.selector.current){
      this.selector.current.focus(false)
    }
  }

  render(){
    return (
      <Selector ref={this.selector}
        {...this.props}
        value={this.state.value}
        availableValues={this.state.values}
        onChange={this.onChange}
        onCommit={this.onCommit}
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
              value={this.state.value}>
              {formattedDate =>
                <span className="calendar-day">{formattedDate}</span>
              }
            </Calendar>
          )

      }
      </Selector>
    )
  }

  matchingValues(value){
    const pattern = new RegExp(`^${value}`,'i')
    return this.props.availableValues.filter(value => pattern.test(value))
  }

  onCommit(value){
    this.props.onCommit(format(parseISO(value),'yyyy-MM-dd'));
  }

  onChange(e){
    const value = e.target.value;
    const values = this.matchingValues(value)
    const open = values.length > 0;
    this.setState({
      value,
      values,
      open,
      selectedIdx: null
    })
  }

}

DatePicker.defaultProps = {
  availableValues : [
    "2018-12-18",
    "2018-12-19",
    "2018-12-20",
    "2018-12-21",
    "2018-12-22",
    "2018-12-23",
    "2018-12-24"
  ]
}