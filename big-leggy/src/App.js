import React, { Component } from 'react';
import formConfig from './LeggyForm/form-config';
import FormModel from './LeggyForm/leggy-model';
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

    const formModel = new FormModel(formConfig, model.legs.length, (fieldName, value) => {
      const {debug} = this.state;
      switch (fieldName){
        case 'rowIdx':
        case 'colIdx':
        case 'compositeFieldIdx':
          console.log(`${fieldName} => ${value}`)
          this.setState({ debug: { ...debug, [fieldName]: value}})
          break;
        default:
      }
    })

    this.state = {
      debug: {
        rowIdx: formModel.rowIdx,
        colIdx: formModel.columnIdx,
        compositeFieldIdx: formModel.compositeFieldIdx
      },
      model,
      formModel
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

    const props = {
      key: idx,
      value: field.getValue(model,leg, idx),
      onCommit : value => this.onChange(field, leg, value)
    }

    switch (type) {
      case COMBO: return  <ComboBox {...props} />
      case DATE:  return  <DatePicker {...props} />
      default: return  <TextInput {...props} />
    }

  }
  
  render() {
    return (
      <div className="App">
        <div className="app-header">
          <TextInput />
        </div>
        <LeggyForm model={this.state.formModel} data={this.state.model}>
          {this.renderFormControl}
        </LeggyForm>
        <div className="app-footer">
          <TextInput />
        </div>

        <div className="debug-panel">
          <span>{`rowIdx: ${this.state.debug.rowIdx}`}</span>
          <span>{`colIdx: ${this.state.debug.colIdx}`}</span>
          <span>{`compositeFieldIdx: ${this.state.debug.compositeFieldIdx}`}</span>
        </div>

      </div>
    );
  }
}

export default App;
