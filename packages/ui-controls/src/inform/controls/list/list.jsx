import React from 'react';
import cx from 'classnames';
import * as StateEvt from '../../../state-machinery/state-events';
import * as Key from '../../../utils/key-code';
import {getKeyboardEvent} from '../../../utils/key-code';
import {searcher} from './searcher';

import './list.css';

const LIST_NAVIGATION_PATTERN = /^(home|end|page-up|page-down|down|up)$/
const isNavigationEvent = stateEvt => LIST_NAVIGATION_PATTERN.test(stateEvt.type);

export default class List extends React.Component {

  constructor(props){
    super(props);

    this.hilitedIdx = -1;
        
    this.listElement = React.createRef();
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.navigateSuggestions = this.navigateSuggestions.bind(this);
    this.setCurrentListItem = this.setCurrentListItem.bind(this);

    if (props.typeaheadListNavigation){
      this.searchKeyHandler = searcher(props.values, this.setCurrentListItem);
    }

  }

  componentDidUpdate(prevProps){
    const {hilitedIdx} = this.props;
    if (hilitedIdx !== prevProps.hilitedIdx  &&
        hilitedIdx !== this.hilitedIdx){
      this.setCurrentListItem(hilitedIdx)
    }
  }

  componentWillUnmount(){
    if (this.searchKeyHandler){
      this.searchKeyHandler = null;
    }
  }

  render(){
    const {values, selectedIdx, onCommit} = this.props;
    const dropdownClassName = "list"

    return values.length === 0 ? (
        <div className="empty-list">Empty List</div>
      ) : (
        <ul className={dropdownClassName} ref={this.listElement}>
        {values.map((value,idx) => (
          <li key={idx} 
            tabIndex={0}
            data-idx={idx}
            className={cx("list-item", {
              selected: idx === selectedIdx
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

  //TODO should accept a prop that configures whether we support
  // typeahead navigation a la Select
  // need to pass TAB back to parent
  handleKeyDown(e){
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt){
      if (stateEvt === StateEvt.ESC){
        this.props.onCancel()
      } else if (stateEvt === StateEvt.ENTER){
        const {hilitedIdx} = this;
        const {values} = this.props;
        this.props.onCommit(values[hilitedIdx])
      } else if (isNavigationEvent(stateEvt)){
        e.stopPropagation();
        this.navigateSuggestions(e.keyCode)
      } else if (this.searchKeyHandler){
        this.searchKeyHandler(e);
      }
    } 
  }

  navigateSuggestions(keyCode){
    const {values} = this.props;
    let {hilitedIdx} = this;
    if (keyCode === Key.UP){
      if (!hilitedIdx){
        hilitedIdx = values.length-1;
      } else {
        hilitedIdx -= 1;
      }
    } else {
      if (hilitedIdx === null){
        hilitedIdx = 0;
      } else if (hilitedIdx === values.length-1){
        hilitedIdx = 0;
      } else {
        hilitedIdx += 1;
      }
    }

    this.setCurrentListItem(hilitedIdx)
  }

  setCurrentListItem(hilitedIdx){
    if (this.hilitedIdx !== hilitedIdx){
      const listItemElement = this.listElement.current.querySelector(`.list-item[data-idx = '${hilitedIdx}']`)
      if (listItemElement){
        listItemElement.focus();
      }
      this.hilitedIdx = hilitedIdx;
    }
  }
}

List.defaultProperties = {
  hilitedIdx: -1,
  selectedIdx: -1
}
