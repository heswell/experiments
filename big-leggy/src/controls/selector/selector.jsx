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
      selectedIdx: props.availableValues.indexOf(props.value),
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
    const {value} = nextProps;
    if (value !== this.props.value){
      this.setState({
        value,
        selectedIdx: nextProps.availableValues.indexOf(value)
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
      inputIcon = 'keyboard_arrow_down',
      dropdownClassName,
      children: childRenderer,
      onChange
    } = this.props;

    const className = cx('control-text', inputClassName, {
      'dropdown-showing': this.state.open
    })

    const childComponent = typeof childRenderer === 'function'
      ? childRenderer(Selector.input)
      : null;

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
        {inputIcon && <i className="control-icon material-icons">{inputIcon}</i>}
        {this.state.open && (
          <Dropdown ref={this.dropdown}
            className={dropdownClassName}
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
    const {children: childRenderer, availableValues, typeaheadListNavigation} = this.props;
    const dropdown = typeof childRenderer === 'function'
      ? childRenderer(Selector.dropdown)
      : null;

    return dropdown || (
      <List
        values={availableValues}
        selectedIdx={this.state.selectedIdx}
        hilitedIdx={this.props.hilitedIdx}
        typeaheadListNavigation={typeaheadListNavigation}
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
    console.log(`[Selector] onKeyDown open=${open}`)
    if (keyCode === Key.ENTER){
      if (this.state.open && this.props.selectedIdx !== null){
        const value = this.props.availableValues[this.props.selectedIdx];
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
Selector.input = 'input'
Selector.dropdown = 'dropdown'

Selector.defaultProps = {
  selectedIdx: null,
  availableValues: []
}

