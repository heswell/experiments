import React from 'react';
import cx from 'classnames';
import dateFns from 'date-fns';
import Calendar from './calendar/calendar-layout';
import Dropdown from './dropdown';
import * as Key from '../utils/key-code';

import './date-picker.css';

export default class DatePicker extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      open: false,
      value: this.props.value || '',
      initialValue: this.props.value,
      position: null,
      selectedIdx: null,
      values: props.availableValues
    }
    this.inputEl = React.createRef();
    this.calendar = React.createRef();
    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onSelect = this.onSelect.bind(this);
    this.onCancel = this.onCancel.bind(this);

  }

  componentDidMount(){
    if (this.inputEl.current){
      const {top, left, width, height} = this.inputEl.current.getBoundingClientRect();
      this.setState({position: {top,left,width,height}})
    }
  }

  focus(){
    if (this.inputEl.current){
      this.inputEl.current.focus();
      this.inputEl.current.select();
    }
  }

  onFocus(){
    this.props.onFocus();
  }

  activate(){
    console.log(`activate this Combo`)
  }

  render(){
    const {onChange, onKeyDown, onBlur} = this;
    const className = cx('control-text', {
      'dropdown-showing': this.state.open
    })
    return (
      <>
        <input
          ref={this.inputEl}
          type="text" 
          className={className}
          value={this.state.value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          onFocus={this.onFocus}
          onClick={this.onClick}
          list={this._id}
        />
        {this.state.open && (
          <Dropdown
            className="date-picker-dropdown"
            position={this.state.position}
            onCommit={this.onSelect}
            onCancel={this.onCancel}>
            <Calendar ref={this.calendar}
              value={this.state.value}>
                {formattedDate =>
                  <span className="calendar-day">{formattedDate}</span>
                }
              </Calendar>
          </Dropdown>  
        )}
      </>
    )
  }

  matchingValues(value){
    const pattern = new RegExp(`^${value}`,'i')
    return this.props.availableValues.filter(value => pattern.test(value))
  }

  onClick(){
    if (!this.state.open){
      this.setState({open: true})
    }
  }

  onSelect(value){
    this.commit(dateFns.format(value,'YYYY-MM-DD'));
  }

  onCancel(){
    // might need to re-focus
    this.setState({open: false})
    this.props.onCancel()
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

  onKeyDown(e){
    const {keyCode} = e;
    const open = this.state.open;
    
    if (keyCode === Key.ENTER){
      if (this.state.open && this.state.selectedIdx !== null){
        const value = this.state.values[this.state.selectedIdx];
        this.commit(value);
      } else if (this.state.value !== this.state.initialValue){
        this.commit();
      } else if (!open){
        this.setState({open: true})
      }

    } else if (keyCode === Key.ESC){
      this.setState({
        value: this.state.initialValue,
        open: false
      });
    } else if (open && (keyCode === Key.UP || keyCode === Key.DOWN)){
      this.navigateSuggestions(keyCode)
    }
  }

  onBlur(e){
    if (this.state.value !== this.state.initialValue){
      this.commit();
    }
  }
  
  commit(value=this.state.value){
    this.setState({
      open: false,
      value: value,
      values: this.matchingValues(value),
      initialValue: value
    }, () => {
      this.props.onCommit(this.state.value);
    })
  }

  navigateSuggestions(keyCode){
    const {availableValues: suggestions} = this.props;
    let {selectedIdx} = this.state;
    if (keyCode === Key.UP){
      if (!selectedIdx){
        selectedIdx = suggestions.length-1;
      } else {
        selectedIdx -= 1;
      }
    } else {
      if (selectedIdx === null){
        selectedIdx = 0;
      } else if (selectedIdx === suggestions.length-1){
        selectedIdx = 0;
      } else {
        selectedIdx += 1;
      }
    }

    this.setState({selectedIdx})
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