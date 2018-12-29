import React, { Component } from 'react';
import leggyModel from './LeggyForm/form-config';
import { LeggyForm } from './LeggyForm/leggy-form';
import TextInput from './controls/text-input';
import DatePicker from './controls/date-picker';
import CompositeControl from './controls/composite-control';
import ComboBox from './controls/combo-box';
import {COMBO, DATE} from './LeggyForm/form-config';
import './App.css';

const model = {

  legs: [
    {
      field1: 'tinsel'
    },
    {
      field1: 'town'
    }
  ]

}

class App extends Component {
  constructor(props){
    super(props)
    this.state = {
      model
    }

    this.renderFormControl = this.renderFormControl.bind(this);
  }

  onChange(field, leg, value){
    console.log(`${field.label} [${leg}] => ${value}`)
  }

  renderFormControl(field, leg){
    const {type} = field;
    if (Array.isArray(type)){
      return (
        <CompositeControl field={field}>
          {type.map((type,idx) => this._renderControl(type, field, leg, idx))}
        </CompositeControl>
      )
    } else {
      return this._renderControl(type, field, leg);
    }
  }

  _renderControl(type, field, leg, idx){
    switch (type) {
      case COMBO:
      return (
        <ComboBox
          key={idx}
          value={field.getValue(model,leg, idx)}
          onCommit={value => this.onChange(field, leg, value)}/>
      )
      case DATE:
      return (
        <DatePicker
          key={idx}
          value={field.getValue(model,leg, idx)}
          onCommit={value => this.onChange(field, leg, value)}/>
      )
      default:
      return (
        <TextInput
          key={idx}
          value={field.getValue(model,leg, idx)}
          onCommit={value => this.onChange(field, leg, value)}/>
      )
    }

  }
  
  render() {
    return (
      <div className="App">
        <LeggyForm config={leggyModel} data={this.state.model}>
          {this.renderFormControl}
        </LeggyForm>
      </div>
    );
  }
}

export default App;
