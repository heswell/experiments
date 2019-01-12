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
      position: null
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

  }

  componentDidMount(){
    if (this.inputEl.current){
      const {top, left, width, height} = this.inputEl.current.getBoundingClientRect();
      this.setState({position: {top,left,width,height}})
    }
  }

  componentWillReceiveProps(nextProps){
    if (nextProps.value !== this.props.value){
      this.setState({
        value: nextProps.value
      })
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
    const {
      inputClassName,
      children: childComponent,
      onChange
    } = this.props;

    const className = cx('control-text', inputClassName, {
      'dropdown-showing': this.state.open
    })

    const props = {
      ref: this.inputEl,
      onKeyDown,
      onBlur,
      onFocus,
      onClick,
      className: cx("control-text", inputClassName, 
      childComponent ? childComponent.props.className : null,
      {
        'dropdown-showing': this.state.open
      })
    }

    const controlText = childComponent 
      ? React.cloneElement(childComponent, props)
      : (
      <input
        {...props}
        type="text" 
        className={className}
        onChange={onChange}
        value={this.state.value}
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
            {this.renderDropdownComponent()}
          </Dropdown>
        )}
      </>
    )
  }

  renderDropdownComponent(){
    return (
      <List
      values={this.props.availableValues}
      hilightedValue={this.state.selectedIdx}
      />
    )
  }

  onClick(){
    if (!this.state.open){
      this.setState({open: true})
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
        this.setState({open: true})
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

  onBlur(){
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
