import React from 'react';
import Selector from '../inform/controls/selector/selector';

import './combo-box.css';

export default class ComboBox extends React.Component {

  constructor(props){
    super(props);
    this.state = {
      value: props.value || '',
      values: props.availableValues
    }
    this.selector = React.createRef();
    this.onChange = this.onChange.bind(this);
  }

  focus(){
    if (this.selector.current){
      this.selector.current.focus(false)
    }
  }

  render(){
    return (
      <Selector ref={this.selector}
        {...this.props}
        value={this.state.value}
        availableValues={this.state.values}
        onChange={this.onChange}
        inputClassName="combo-input"/>
    )
  }

  onChange(e){
    const value = e.target.value;
    const values = this.matchingValues(value)
    this.setState({
      value,
      values,
      selectedIdx: null
    })
  }

  matchingValues(value){
    const pattern = new RegExp(`^${value}`,'i')
    return this.props.availableValues.filter(value => pattern.test(value))
  }
}

ComboBox.defaultProps = {
  availableValues : [
    "Java",
    "Javascript",
    "Julia",
    "Perl",
    "Pascal",
    "PHP",
    "Python",
    "Ruby"
  ]
}
