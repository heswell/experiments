import React from 'react';
import cx from 'classnames';
import Control from './leggy-control';

export default class Field extends React.Component {

  constructor(props){
    super(props)
    this.state = {
      popupActive: false
    }
    this.control = React.createRef();
  }

  focus(idx){
    if (this.control.current && this.control.current.focus) {
      this.control.current.focus(idx)
    }
  }

  renderChild(){
    const {field, leg, render, onCommit, onCancel, onFocusControl} = this.props;
    if (field.type === 'empty'){
      return <div className="empty" />;
    }
    let child = render(field, leg);
    const props = {
      ref: this.control,
      onCancel: () => onCancel(field),
      onPopupActive: popupActive => this.setState({popupActive})
    }
    if (child.props.onCommit){
      const _commit = child.props.onCommit;
      props.onCommit = value => {
        onCommit(field);
        _commit(value);
      }
    } else {
      props.onCommit = () => onCommit(field)
    }
    props.onFocus = (controlIdx=null) => onFocusControl(field, controlIdx)

    child = React.cloneElement(child, props)
    
    return (
      <Control tabIdx={field.tabIdx}>
        {child}
      </Control>
    )
  }

  render(){
    const {field, onKeyDown, onClick} = this.props;
    const className = cx("field", {
      "popup-active": this.state.popupActive
    })

    return (
      <div ref={this.el} className={className} 
        data-idx={field.tabIdx}
        onClickCapture={e => onClick(field)}
        onKeyDownCapture={onKeyDown}>
          {this.renderChild()}
      </div>
    )
  }
}
