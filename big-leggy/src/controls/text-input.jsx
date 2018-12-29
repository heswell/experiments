import React from 'react';
import * as Key from '../utils/key-code';

export default class TextInput extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      value: this.props.value || '',
      initialValue: this.props.value || ''
    }
    this.inputEl = React.createRef();
    this.onChange = this.onChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.onFocus = this.onFocus.bind(this);
  }

  focus(){
    console.log(`==> focus<TextInput>`)
    if (this.inputEl.current){
      this.inputEl.current.focus();
      this.inputEl.current.select();
    }
  }

  render(){
    const {onChange, onKeyDown, onBlur, onFocus} = this;
    return (
      <input
        ref={this.inputEl}
        type="text" 
        className="control-text"
        value={this.state.value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        onFocus={onFocus}
      />
    )
  }

  onFocus(){
    console.log(`onFocus<TextInput> ==>`)
    // call onFocus props
    if (this.props.onFocus){
      this.props.onFocus()
    }
  }

  onChange(e){
    this.setState({value: e.target.value})
  }
  onKeyDown(e){
    const {keyCode} = e;
    if (keyCode === Key.ENTER){
      this.commit();
    } else if (keyCode === Key.ESC){
      this.setState({
        value: this.state.initialValue
      });
    }
  }
  onBlur(e){
    if (this.state.value !== this.state.initialValue){
      console.log(`[TextInput] onBlur => commit initialValue '${this.state.initialValue}' value '${this.state.value}'`)
      this.commit();
    } else {
      console.log(`[TextInput] onBlur NO commit initialValue '${this.state.initialValue}' value '${this.state.value}'`)
    }
  }

  commit(){
    this.setState({
      initialValue: this.state.value
    }, () => {
      this.props.onCommit(this.state.value);
    })
  }

}
