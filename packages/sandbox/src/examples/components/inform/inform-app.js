import React, { Component } from 'react';
import formConfig from './form-config';
import { Form, FormModel, TextInput, ComboBox, CompositeControl, DatePicker, Select, Toggle } from '@heswell/ui-controls';
import {COMBO, DATE, TOGGLE, SELECT} from './form-config';

import './inform-app.css';

const data = {

  legs: [
    {
      field01: 'tinsel',
      field07: ['stevo', 'Java'],
      field11: 'a'
    },
    {
      field01: 'town'
    }
  ]

}

class App extends Component {
  constructor(props){
    super(props)

    const formModel = new FormModel(formConfig, data.legs.length, (fieldName, value) => {
      switch (fieldName){
        case 'rowIdx':
        case 'colIdx':
        case 'compositeFieldIdx':
          // console.log(`${fieldName} => ${value} existingState: ${JSON.stringify(debug)}`)
          this.setState(state => ({ debug: { ...state.debug, [fieldName]: value}}))
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
      data,
      formModel
    }

    this.renderFormControl = this.renderFormControl.bind(this);
  }

  onChange(field, legIdx, value){
    const {data} = this.state;
    this.setState({
      data: {
        ...data,
        legs: data.legs.map((leg,i) => 
          i === legIdx
            ? {...leg, [field.id]: value}
            : leg
        )
      }
    })
  }

  renderFormControl(field, leg, resolveType=true){
    const {type} = field;

    if (resolveType && field.getType){
      return this.renderFormControl({
        ...field,
        type: field.getType(this.state.data.legs[leg])
      }, leg, false);
    } else if (Array.isArray(type)){
      return (
        <CompositeControl field={field}>
          {type.map((type,idx) => this._renderControl(type, field, leg, idx))}
        </CompositeControl>
      )
    } else if (typeof type === 'function'){
      const currentType = type(this.state.data);
      return this.renderFormControl({
        ...field,
        type: currentType
      }, leg)
    } else {
      return this._renderControl(type, field, leg);
    }
  }

  _renderControl(type, field, leg, idx, onCommit = value => this.onChange(field, leg, value)){
    const {data} = this.state;
    const props = {
      key: idx,
      value: field.getValue(data,leg, idx),
      onCommit
    }

    // console.log(`value for ${field.id}[${leg}][${idx}] = ${props.value}`)

    switch (type) {
      case COMBO: return  <ComboBox {...props} />
      case SELECT: return  <Select {...props} />
      case DATE:  return  <DatePicker {...props} />
      case TOGGLE: return <Toggle {...props} values={field.values} shortcuts={field.shortcuts}/>
      default: return  <TextInput {...props} />
    }
  }
  
  render() {
    return (
      <div className="App">
        <div className="app-header">
          <TextInput />
        </div>
        <Form model={this.state.formModel} data={this.state.data}>
          {this.renderFormControl}
        </Form>
        <div className="app-footer">
          <TextInput />
        </div>

        <div className="debug-panel">
          <span>{`rowIdx: ${this.state.debug.rowIdx}`}</span>
          <span>{`colIdx: ${this.state.debug.colIdx}`}</span>
          <span>{`compositeFieldIdx: ${this.state.debug.compositeFieldIdx}`}</span>
        </div>
        <div className="model-debug">
          {
            this.state.data.legs.map((leg,i) => (
              <div key={i} className="model-leg">
                {Object.keys(leg).sort().map((key) => (
                  <div key={key} className="model-leg-property">{`${key} : ${leg[key]}`}</div>
                ))}
              </div>
            ))
          }
        </div>

      </div>
    );
  }
}

export default App;
