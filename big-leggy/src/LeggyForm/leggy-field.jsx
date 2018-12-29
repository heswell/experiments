import React from 'react';
import Control from './leggy-control';

export default class Field extends React.Component {

  constructor(props){
    super(props)
    this.control = React.createRef();
  }

  focus(idx){
    console.log(`focus field ${this.props.field.label}`)
    if (this.control.current && this.control.current.focus) {
      this.control.current.focus(idx)
    }
  }

  activate(){
    console.log(`activate field ${this.props.field.label}`)
    if (this.control.current){
      this.control.current.activate();

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
      onCancel: () => onCancel(field)
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

    return (
      <div ref={this.el} className="field" 
        data-idx={field.tabIdx}
        onClickCapture={e => onClick(field)}
        onKeyDownCapture={onKeyDown}>
          {this.renderChild()}
      </div>
    )
  }
}
