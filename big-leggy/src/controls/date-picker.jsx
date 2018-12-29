import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import dateFns from 'date-fns';
import CalendarLayout from './calendar/calendar-layout';
import * as Key from '../utils/key-code';

import './date-picker.css';
import './calendar/calendar.css';

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

    this.documentClickListener = evt => this.handleClickAway(evt);
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
    const {values} = this.state;
    return (
      <>
        <input
          ref={this.inputEl}
          type="text" 
          className="control-text"
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
            values={values}
            hilightedValue={this.state.selectedIdx}
            position={this.state.position}>
              <Calendar ref={this.calendar}
                value={this.state.value}
                onSelect={this.onSelect}
                onCancel={this.onCancel}/>
          </Dropdown>  
        )}
      </>
    )
  }

  listenforClickAway(listen){
    if (listen){
      document.body.addEventListener('click',this.documentClickListener,true);
    } else {
      document.body.removeEventListener('click',this.documentClickListener,true);
    }
  }

  handleClickAway(evt){
    console.log('handleClickAway')
    const {target} = evt;
    const el = this.inputEl.current;
    const calendarEl = ReactDOM.findDOMNode(this.calendar.current);
    if (target !== el && !el.contains(target) && calendarEl !== target && !calendarEl.contains(target)){
      if (this.state.open){
        this.setState({open: false}, () => {
          this.listenforClickAway(false);
        });
      }
    }
  }

  matchingValues(value){
    const pattern = new RegExp(`^${value}`,'i')
    return this.props.availableValues.filter(value => pattern.test(value))
  }

  onClick(){
    if (!this.state.open){
      this.setState({open: true}, () => {
        this.listenforClickAway(true);
      })
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
    const wasOpen = this.state.open;
    const open = values.length > 0;
    this.setState({
      value,
      values,
      open,
      selectedIdx: null
    }, () => {
      if (open !== wasOpen){
        this.listenforClickAway(open);
      }
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
        this.setState({open: true}, () => {
          this.listenforClickAway(true);
        })
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
    const wasOpen = this.state.open;
    this.setState({
      open: false,
      value: value,
      values: this.matchingValues(value),
      initialValue: value
    }, () => {
      if (wasOpen){
        this.listenforClickAway(false);
      }
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

class Dropdown extends React.Component {

  render(){
    const {position: {top,left,width,height}, children} = this.props;
    return ReactDOM.createPortal(
      <div className="control-dropdown" style={{top:top+height,left, width}}>
        {children}
      </div>,
      document.body)
  }
}

class Calendar extends React.Component {

  renderDate(formattedDate){
    return (
      <span className="calendar-day">{formattedDate}</span>
    )

  }

  render(){
    const {style} = this.props;
    const dropdownClassName = "date-picker-dropdown calendar"
      return (
        <div className={dropdownClassName} style={style}>
          <CalendarLayout
            value={this.props.value}
            onSelect={this.props.onSelect}
            onCancel={this.props.onCancel}>
              {this.renderDate}
            </CalendarLayout>
        </div>
      )
    }
  
  }