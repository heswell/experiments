import React from 'react';
import cx from 'classnames';
import * as StateEvt from '../../state-machinery/state-events';
import * as Key from '../../utils/key-code';
import {getKeyboardEvent} from '../../utils/key-code';

import './list.css';

const LIST_NAVIGATION_PATTERN = /^(home|end|page-up|page-down|down|up)$/
const isNavigationEvent = stateEvt => LIST_NAVIGATION_PATTERN.test(stateEvt.type);

export default class List extends React.Component {

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
    console.log(`[List] setCurrentListItem ${selectedIdx}`)
    if (this.selectedIdx !== selectedIdx){
      const listItemElement = this.listElement.current.querySelector(`.list-item[data-idx = '${selectedIdx}']`)
      if (listItemElement){
        listItemElement.focus();
      }
      this.selectedIdx = selectedIdx;
    }
  }
}
