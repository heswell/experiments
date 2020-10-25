import React, { useEffect, useReducer, useRef } from 'react';
import cx from 'classnames';
import { Machine} from 'xstate';
import {states} from '../state-machinery/machines/main'
import * as StateEvt from '../state-machinery/state-events';
import formReducer, { initModel} from './form-reducer';
import * as selector from './form-selectors';
import Field from './field';
import {getKeyboardEvent} from '../utils/key-code';
import './form.css';

export const DOWN = 'down';
export const UP = 'up';
export const RIGHT = 'right';
export const LEFT = 'left';

const Row = ({className, children}) => (
  <div className={className}>{children}</div>
)

export function Form({ children: renderCallback, data, config }){

  const [model, dispatch] = useReducer(formReducer, config, initModel);
  const modelRef = useRef(model);

  useEffect(() => {
    modelRef.current = model;
  },[model])

  // how can we eliminate this ?
  const ctx = {
    findField(field, rows, legCount){
      return selector.findField(modelRef.current, field, rows, legCount)
    },
    nextField(navType){
      return selector.nextField(modelRef.current, navType)
    },
    compositeFieldType(field){
      return selector.compositeFieldType(modelRef.current, field)
    },
    nextCompositeFieldType(field){
      return selector.nextCompositeFieldType(modelRef.current, field)
    },
    isComboType(){
      return selector.isCombo(modelRef.current)
    },
    isSelect(){
      return selector.isSelect(modelRef.current)
    }
  }

  useEffect(() => {
    if (model.currentField){
      focusField(model.currentField, model.compositeFieldIdx)
    }
  },[model.currentField, model.compositeFieldIdx])


  const stateMachine = useRef(new Machine(states, null, ctx));

  const fieldRefs = useRef([]);
  const state = useRef(stateMachine.current.initialState);

  function setRef(target){
    if (target && target.field){
      fieldRefs.current[target.field.tabIdx] = target;
    }
  }

  function handleCancel(){
    stateTransition(StateEvt.ESC);// Should be cancel
    // We may be receiving control back from focussed model, make sure focus
    // returns to same field...
    focusField(model.currentField, model.compositeFieldIdx);
  }

  function handleClickCapture(field, compositeFieldIdx){
    console.log(`handleClickCapture ${field.id} [${compositeFieldIdx}]`)
    if (field === modelRef.current.currentField && state.current.matches('focus')){
      // we can't rely on focus to handle click events when element clicked already
      // had focus - what about composites ? 
      const stateEvt = {
        ...StateEvt.CLICK,
        field,
        compositeFieldIdx
      }
      stateTransition(stateEvt);
    }
  }

  function handleCommit(field){
    const {event} = state.current;
    if (event !== StateEvt.TAB){
      console.log(`[leggy-form] handleCommit ${JSON.stringify(field)} ${modelRef.current.compositeFieldIdx}`)
      // if commit was triggered by blur, because user used TAB, transition has already happened.
      stateTransition({...StateEvt.COMMIT, field});  
    }
  }

  function handleFocus(field, compositeFieldIdx=0){
    console.log(`[leggy-form] handleFocus [${compositeFieldIdx}] ${field.type} `)
    const m = modelRef.current;
    if (field !== m.currentField || compositeFieldIdx !== m.compositeFieldIdx){
        console.log(`\t...StateTransition CLICK because field ${field ? field.id : null} !== ${m.currentField ? m.currentField.id : null} 
          OR compositeFieldIdx (${compositeFieldIdx}) !== ${m.compositeFieldIdx}`)
        const stateEvt = {
          ...StateEvt.CLICK, // should this be FOCUS ?
          field,
          compositeFieldIdx
        }
        stateTransition(stateEvt);
    }
  } 

  function handleKeyDown(e){
    // console.log(`keyDown ${e.keyCode} ${e.key}`)
    const {currentField, compositeFieldIdx} = modelRef.current;
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt){
      stateTransition(stateEvt);
      if ((state.current.matches('focus') && stateEvt !== StateEvt.ESC)){
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }

  function stateTransition(evt){
    console.group(`%c${evt.type} => from ${JSON.stringify(state.current.value)}  target=[${evt.compositeFieldIdx}]`, 'color: blue;font-weight: bold;')
    const s2 = state.current = stateMachine.current.transition(state.current, evt)
    s2.actions.forEach(({type}) => dispatch({type, evt}));
    console.log(`%c    => ${JSON.stringify(state.current.value)} [${state.current.context.compositeFieldIdx}]`, 'color: blue;font-weight: bold;');
    console.groupEnd();
  }

  function focusField(field, idx=0){
    console.log(`[leggy-form] focusField ${field.id} [${idx}] (model current field = ${model.currentField.id})`)
    const fieldComponent = fieldRefs.current[field.tabIdx];
    if (fieldComponent){
      console.log(`setField focus on field ${field.id} [${idx}] IGNORE_FOCUS=true`);
      fieldComponent.focus(idx);
    }
  }

  function buildRows(){
    return model.rows.map((row,idx) => {
      const className = cx('field-row', {
        'head-row': idx === 0,
        'empty-row': row.isEmpty
      })
      return (
        <Row className={className} key={idx}>
          {!row.isEmpty && 
           <div className="field-label">{row.label}</div>
          }
          {row.fields.map((field, idx) => 
            // maybe handle all these at the top level rather than register handlers on every field ?
            <Field key={idx}
              ref={setRef}
              leg={idx}
              field={field}
              model={data}
              onCancel={handleCancel}
              onClickCapture={handleClickCapture}
              onCommit={handleCommit}
              onFocusControl={handleFocus}
              onKeyDown={handleKeyDown}
              render={renderCallback} />
          )}
        </Row>
      )
    });
  }

  return (
      <div className="leggy-form">
        <div className="add-leg-bar"><span>+</span></div>
        {buildRows()}
      </div>
  );

}