import React from 'react';

export default class CompositeControl extends React.Component {
  constructor(props){
    super(props);
    this.childRefs = [];
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

  render(){
    const {field, children, onCommit, onFocus} = this.props;
    return (
      <div className="composite-control">
      {children.map((child,idx) => {
          const props = {
            ref: c => this.setRef(c, idx),
            onFocus: () => onFocus(idx)
          }
          if (child.props.onCommit){
            const _commit = child.props.onCommit;
            props.onCommit = value => {
              onCommit(field);
              _commit(value);
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