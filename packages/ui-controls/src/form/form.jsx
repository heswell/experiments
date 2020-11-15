import React, { useEffect, useReducer, useRef } from 'react';
import cx from 'classnames';
import {states} from '../state-machinery/machines/main'
import * as StateEvt from '../state-machinery/state-events';
import formReducer, { initModel} from './form-reducer';
import * as selector from './form-selectors';
import Field from './field';
import {getKeyboardEvent, TAB} from '../utils/key-code';
import useStateMachine from './use-state-machine';
import './form.css';

export const DOWN = 'down';
export const UP = 'up';
export const RIGHT = 'right';
export const LEFT = 'left';

const MOUSE_FOCUS = 0;
const KEYBOARD_FOCUS = 1;
const focusModes = ['mouse','keyboard']

const Row = ({className, children}) => (
  <div className={className}>{children}</div>
)

export function Form({ children: renderCallback, data, config }){
    const focusMode = useRef(KEYBOARD_FOCUS)

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
      },
      isKeyboardNavigation(){
        console.log(`isKeyboardNavigation ${focusMode.current === KEYBOARD_FOCUS}`)
        return focusMode.current === KEYBOARD_FOCUS;
      }
    }
    const [model, dispatch] = useReducer(formReducer, config, initModel);
  
  const [state, stateTransition] = useStateMachine(states, ctx, dispatch)
  const modelRef = useRef(model);
  const fieldRefs = useRef([]);

  useEffect(() => {
    modelRef.current = model;
  },[model])


  useEffect(() => {
    if (model.currentField){
      focusField(model.currentField, model.compositeFieldIdx)
    }
  },[model.currentField, model.compositeFieldIdx])



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

  const handleFormKeyDownCapture = (e) => {
    if (e.keyCode === TAB){
      focusMode.current = KEYBOARD_FOCUS;
  
    }
  }

  const handleFormMouseDownCapture = () => {
    focusMode.current = MOUSE_FOCUS;
  }

  const handleFormMouseLeave = () => {
    focusMode.current = KEYBOARD_FOCUS;
  }

  function handleFieldClickCapture(field, compositeFieldIdx){
    console.log(`[Form] handleFieldClickCapture ${field.id} [${compositeFieldIdx}, currentField ${modelRef.current.currentField}`)
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
    stateTransition({...StateEvt.COMMIT, field});  
  }

  function handleFocus(field, compositeFieldIdx=0){
    console.log(`[Form] handleFocus [${compositeFieldIdx}] ${field.type} `)
    const m = modelRef.current;
    if (field !== m.currentField || compositeFieldIdx !== m.compositeFieldIdx){
          
          const stateEvt = {
          ...StateEvt.FOCUS,
          field,
          compositeFieldIdx
        }
        stateTransition(stateEvt);
    }
  } 

  function handleKeyDown(e){
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt){
      stateTransition(stateEvt);
      // if ((state.current.matches('focus') && stateEvt !== StateEvt.ESC)){
      //   e.stopPropagation();
      //   e.preventDefault();
      // }
    }
  }

  function focusField(field, idx=0){
    console.log(`[Form] focusField ${field.id} [${idx}] (model current field = ${model.currentField.id})`)
    const fieldComponent = fieldRefs.current[field.tabIdx];
    if (fieldComponent){
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
              onClickCapture={handleFieldClickCapture}
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
      <div className="leggy-form"
        onKeyDownCapture={handleFormKeyDownCapture}
        onMouseDownCapture={handleFormMouseDownCapture}
        onMouseLeave={handleFormMouseLeave}>
        <div className="add-leg-bar"><span>+</span></div>
        {buildRows()}
      </div>
  );

}