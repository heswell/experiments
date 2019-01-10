import React from 'react';
import cx from 'classnames';
import Dropdown from '../dropdown';
import List from '../list';
import * as Key from '../../utils/key-code';

import './selector.css';

export default class Selector extends React.Component {

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

  focus(selectText=true){
    if (this.inputEl.current){
      this.inputEl.current.focus();
      if (selectText){
        this.inputEl.current.select();
      }
    }
  }

  onFocus(){
    this.props.onFocus();
  }

  render(){
    const {onKeyDown, onBlur, onFocus, onClick} = this;
    const {values} = this.state;

    const className = cx('control-text', 'combo-input', {
      'dropdown-showing': this.state.open
    })

    const props = {
      ref: this.inputEl,
      onKeyDown,
      onBlur,
      onFocus,
      onClick
    }

    const controlText = this.props.children 
      ? React.cloneElement(this.props.children, props)
      : (
      <input
        {...props}
        type="text" 
        className={className}
        value={this.state.value}
        list={this._id}
      />
    )

    return (
      <>
        {controlText}
        <i className="control-icon material-icons">keyboard_arrow_down</i>
        {this.state.open && (
          <Dropdown ref={this.dropdown}
            componentName="List"
            position={this.state.position}
            onCommit={this.onSelect}
            onCancel={this.onCancel}>
            <List
              values={values}
              hilightedValue={this.state.selectedIdx}
              />
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
    const el = this.inputEl.current;
    if (evt.target !== el && !el.contains(evt.target)){
      if (this.state.open){
        this.onCancel(); // should this cancel or simple close ?
      }
    }
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
    } else if (this.props.onKeyDown){
      this.props.onKeyDown(e)
    }
  }

  focusDropdown(){
    this.ignoreBlur = true;
    this.dropdown.current.focus();
    this.props.onPopupActive(true);
  }

  onBlur(e){
    if (!this.ignoreBlur && this.state.value !== this.state.initialValue){
      console.log(`[Selector] onBlur => commit`)
      this.commit();
    }
  }

  commit(value=this.state.value){
    const wasOpen = this.state.open;
    this.setState({
      open: false,
      value: value,
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

Selector.defaultProps = {
  availableValues : [
    "Alabama",
    "Arizona",
    "California",
    "Colorado",
    "Florida",
    "Georgia",
    "Idaho",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Montana",
    "Missouri",
    "Mississippi",
    "New England",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Dakota",
    "Ohio",
    "Philadelphia",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Virginia"
  ]
}
