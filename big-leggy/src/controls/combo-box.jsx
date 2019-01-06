import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import * as StateEvt from '../state-machinery/state-events';
import {getKeyboardEvent} from '../utils/key-code';

import * as Key from '../utils/key-code';

import './combo-box.css';

const LIST_NAVIGATION_PATTERN = /^(home|end|page-up|page-down|down|up)$/
const isNavigationEvent = stateEvt => LIST_NAVIGATION_PATTERN.test(stateEvt.type);

export default class ComboBox extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      open: false,
      value: this.props.value || '',
      initialValue: this.props.value,
      position: null,
      values: props.availableValues
    }

    this.ignoreBlur = false;

    this.inputEl = React.createRef();
    this.dataList = React.createRef();
    this.dropdown = React.createRef();

    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.onClick = this.onClick.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onSelect = this.onSelect.bind(this);

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
          <Dropdown ref={this.dropdown} position={this.state.position}>
            <List
              values={values}
              hilightedValue={this.state.selectedIdx}
              onCommit={this.onSelect}
              onCancel={this.onCancel}/>
          </Dropdown>
        )}
      </>
    )
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

  listenforClickAway(listen){
    if (listen){
      document.body.addEventListener('click',this.documentClickListener,true);
    } else {
      document.body.removeEventListener('click',this.documentClickListener,true);
    }
  }

  handleClickAway(evt){
    const el = this.inputEl.current;
    if (evt.target !== el && !el.contains(evt.target)){
      if (this.state.open){
        this.onCancel(); // should this cancel or simple close ?
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
    this.commit(value);
  }

  onCancel(){
    this.setState({
      value: this.state.initialValue,
      open: false
    }, () => {
      this.listenforClickAway(false);
      this.props.onPopupActive(false);
    });
    this.props.onCancel()
  }

  onKeyDown(e){
    const {keyCode} = e;
    const open = this.state.open;
    console.log(`[ComboBox] onKeyDown open=${open}`)
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
      this.onCancel();
    } else if (open && (keyCode === Key.UP || keyCode === Key.DOWN)){
      this.focusDropdown();
    }
  }

  focusDropdown(){
    this.ignoreBlur = true;
    this.dropdown.current.focus();
    this.props.onPopupActive(true);
  }

  onBlur(e){
    if (!this.ignoreBlur && this.state.value !== this.state.initialValue){
      console.log(`[ComboBox] onBlur => commit`)
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
        this.props.onPopupActive(false);
      }
      this.props.onCommit(this.state.value);
    })
    this.ignoreBlur = false;
  }

}

ComboBox.defaultProps = {
  availableValues : [
    "Java",
    "Javascript",
    "Julia",
    "Perl",
    "Pascal",
    "PHP",
    "Python",
    "Ruby"
  ]
}

class List extends React.Component {

  constructor(props){
    super(props);

    this.selectedIdx = -1;
    this.listElement = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.navigateSuggestions = this.navigateSuggestions.bind(this);
  }

  render(){
    const {values, hilightedValue,onCommit} = this.props;
    const dropdownClassName = "list"

    return (
        <ul className={dropdownClassName} ref={this.listElement}>
        {values.map((value,idx) => (
          <li key={idx} 
            tabIndex={0}
            data-idx={idx}
            className={cx("list-item", {
              highlighted: idx === hilightedValue
            })}
            onKeyDown={this.handleKeyDown}
            onClick={() => onCommit(value)}>
            <span>{value}</span>
          </li>
        ))}
      </ul>
    )
  }

  focus(){
    this.setCurrentListItem(0);
  }

  handleKeyDown(e){
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt){
      console.log(`List.handleKeyDown ${JSON.stringify(stateEvt)}`)
      if (stateEvt === StateEvt.ESC){
        this.props.onCancel()
      } else if (stateEvt === StateEvt.ENTER){
        const {selectedIdx} = this;
        const {values} = this.props;
        this.props.onCommit(values[selectedIdx])
      } else if (isNavigationEvent(stateEvt)){
        e.stopPropagation();
        this.navigateSuggestions(e.keyCode)
      } 
    }
  }

  navigateSuggestions(keyCode){
    const {values} = this.props;
    let {selectedIdx} = this;
    if (keyCode === Key.UP){
      if (!selectedIdx){
        selectedIdx = values.length-1;
      } else {
        selectedIdx -= 1;
      }
    } else {
      if (selectedIdx === null){
        selectedIdx = 0;
      } else if (selectedIdx === values.length-1){
        selectedIdx = 0;
      } else {
        selectedIdx += 1;
      }
    }

    this.setCurrentListItem(selectedIdx)
  }

  setCurrentListItem(selectedIdx){
    if (this.selectedIdx !== selectedIdx){
      const listItemElement = this.listElement.current.querySelector(`.list-item[data-idx = '${selectedIdx}']`)
      if (listItemElement){
        console.log(`focus listItem`)
        listItemElement.focus();
      }
      this.selectedIdx = selectedIdx;
    }
  }
  
}


class Dropdown extends React.Component {

  constructor(props){
    super(props)
    this.childComponent = React.createRef();
  }

  focus(){
    this.childComponent.current.focus();
  }

  render(){
    const {position: {top,left,width,height}, children: component} = this.props;
    const className = "dropdown"

    return ReactDOM.createPortal(
      <div className={className} style={{top:top+height,left, width}}>
        {React.cloneElement(component, {
          ref: this.childComponent
        })}
      </div>,
      document.body
    )
  }
}