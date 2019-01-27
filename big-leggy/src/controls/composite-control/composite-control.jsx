import React from 'react';

import './composite-control.css';

export default class CompositeControl extends React.Component {
  constructor(props){
    super(props);
    this.childRefs = [];
    this.state = {
      value: []
    }
  }
  focus(idx=0){
    const component = this.childRefs[idx];
    if (component && component.focus){
      console.log(`composite-control focus ${idx}`)
      component.focus();
    }
  }

  setRef(c, idx){
    this.childRefs[idx] = c;
  }

  commit(newValue, idx, controlCommitCallback){
    const {field} = this.props;
    console.log(`composite (${field.id}) commit ${idx}`)
    const value = [...this.state.value];
    value[idx] = newValue;
    this.setState({value},() => {
      controlCommitCallback(this.state.value[idx])
    })
    this.props.onCommit(field);
  }

  render(){
    const {children, onCancel, onFocus, onPopupActive} = this.props;
    return (
      <div className="composite-control">
      {children.map((child,idx) => {
          const props = {
            ref: c => this.setRef(c, idx),
            onFocus: () => {
              onFocus(idx)
            },
            onPopupActive,
            onCancel
          }
          if (child.props.onCommit){
            const _commit = child.props.onCommit;
            props.onCommit = value => {
              this.commit(value, idx, _commit)
            }
          }
          const component = React.cloneElement(child, props)

        return (
          <div className="composite-item" key={idx}>
            {component}
          </div>
        )
        })}
    </div>
    )
  }
}