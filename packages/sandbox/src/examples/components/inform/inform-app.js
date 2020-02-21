import React, { useState } from 'react';
import formConfig from './form-config';
import { Form, TextInput, ComboBox, CompositeControl, DatePicker, Select, Toggle } from '@heswell/ui-controls';
import {COMBO, DATE, TOGGLE, SELECT} from './form-config';

import './inform-app.css';

export default function App(){

  const [data, setData] = useState({
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
  });

  const onChange = (field, legIdx, value) => {
    setData({
        ...data,
        legs: data.legs.map((leg,i) => 
          i === legIdx
            ? {...leg, [field.id]: value}
            : leg
        )
    })
  }

  function renderFormControl(field, leg, resolveType=true){
    const {type} = field;

    if (resolveType && field.getType){
      return renderFormControl({
        ...field,
        type: field.getType(data.legs[leg])
      }, leg, false);
    } else if (Array.isArray(type)){
      return (
        <CompositeControl field={field}>
          {type.map((type,idx) => _renderControl(type, field, leg, idx))}
        </CompositeControl>
      )
    } else if (typeof type === 'function'){
      const currentType = type(data);
      return renderFormControl({
        ...field,
        type: currentType
      }, leg)
    } else {
      return _renderControl(type, field, leg);
    }
  }

  function _renderControl(type, field, leg, idx, onCommit = value => onChange(field, leg, value)){
    const props = {
      key: idx,
      value: field.getValue(data, leg, idx),
      onCommit
    }

    switch (type) {
      case COMBO: return  <ComboBox {...props} />
      case SELECT: return  <Select {...props} />
      case DATE:  return  <DatePicker {...props} />
      case TOGGLE: return <Toggle {...props} values={field.values} shortcuts={field.shortcuts}/>
      default: return  <TextInput {...props} />
    }
  }
  
  return (
      <div className="App">
        <div className="app-header">
          <TextInput />
        </div>
        <Form config={formConfig} data={data}>
          {renderFormControl}
        </Form>
        <div className="app-footer">
          <TextInput />
        </div>

        <div className="model-debug">
          {
            data.legs.map((leg,i) => (
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
