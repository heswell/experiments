import React from 'react';
import Selector from '../selector';

import './select.css';

export default class Select extends React.Component {
  constructor(props){
    super(props);
    this.selector = React.createRef();
    this.onKeyDown = this.onKeyDown.bind(this);
  }
  render(){
    // const {onKeyDown, onBlur} = this.props;
    console.log(`[Select] render ${this.props.value}`)
    return (
      <Selector ref={this.selector}
        {...this.props}
        onKeyDown={this.onKeyDown}>
        <div tabIndex={0} className="control-text select-input">
            {this.props.value}
        </div>

      </Selector>
    )
  }

  onKeyDown(e){
    console.log(`[Select] onKeyDown ${e.key}`)
  }

  focus(){
    if (this.selector.current){
      this.selector.current.focus(false)
    }
  }

}