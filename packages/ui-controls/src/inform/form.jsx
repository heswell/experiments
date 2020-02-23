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

function runActions(actions, ctx, evt) {
  actions.forEach(action => action.exec(ctx, evt))
}

const Row = ({className, children}) => (
  <div className={className}>{children}</div>
)

export function Form({ children: renderCallback, data, config }){

  const stateOptions = {
    actions: {
        setField: (_, evt) => dispatch({type: 'SET_FIELD', evt}),
        setNextField: (_, evt) => dispatch({type: 'SET_NEXT_FIELD', evt}),
        setNextCompositeField: (_, evt) => dispatch({type: 'SET_NEXT_COMPOSITE_FIELD'}),
        // setNextCompositeField: () => dispatch({type: 'SET_NEXT_COMPOSUTE_FIELD', compositeFieldIdx: modelRef.current.compositeFieldIdx+1}),
        resetField: () => dispatch({type: 'CLEAR_FIELD'})
    }
  }

  const [modelX, dispatch] = useReducer(formReducer(stateOptions), config, initModel);
  const modelRef = useRef(modelX);

  useEffect(() => {
    console.log(`model has changed`)
    modelRef.current = modelX;
  },[modelX])

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
    console.log(`%cfield or compositeIdx has changed ${modelX.currentField ? modelX.currentField.id : null}`,'color:blue;font-weight:bold;');
    if (modelX.currentField){
      focusField(modelX.currentField, modelX.compositeFieldIdx)
    }
  },[modelX.currentField, modelX.compositeFieldIdx])


  const stateMachine = useRef(new Machine(states, stateOptions, ctx));

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

  function handleClick(field, compositeFieldIdx){
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
      const startingField = currentField;
      stateTransition(stateEvt);
      // TODO how can we eliminate this logic - we need a simple indication of whether
      // key has been handled already - a model method ? 
      // Don't swallow tab if the control being edited may need it 
      // const tabbed = (StateEvt.isTabNavEvt(stateEvt)) &&
      //   (model.currentField !== startingField ||
      //     compositeFieldIdx !== model.compositeFieldIdx );
      // In what scenario do we need this treatment of ESC ?
      if ((state.current.matches('focus') && stateEvt !== StateEvt.ESC) /* || tabbed*/){
        console.log(`stop event propagation`)
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }

  function stateTransition(stateEvt){
    console.group(`%c${stateEvt.type} => from ${JSON.stringify(state.current.value)}  target=[${stateEvt.compositeFieldIdx}]`, 'color: blue;font-weight: bold;')
    const s2 = state.current = stateMachine.current.transition(state.current, stateEvt)
    runActions(s2.actions, s2.context, stateEvt);
    console.log(`%c    => ${JSON.stringify(state.current.value)} [${state.current.context.compositeFieldIdx}]`, 'color: blue;font-weight: bold;');
    console.groupEnd();
  }

  function focusField(field, idx=0){
    console.log(`[leggy-form] focusField ${field.id} [${idx}] (model current field = ${modelX.currentField.id})`)
    const fieldComponent = fieldRefs.current[field.tabIdx];
    if (fieldComponent){
      console.log(`setField focus on field ${field.id} [${idx}] IGNORE_FOCUS=true`);
      fieldComponent.focus(idx);
    }
  }

  function setCompositeField(field=model.currentField){
    const idx = model.compositeFieldIdx;
    const fieldComponent = fieldRefs.current[field.tabIdx];
    if (fieldComponent){
      console.log(`setCompositeField focus on composite field, tabIndex ${field.tabIdx} [${idx}] IGNORE_FOCUS=true`);
      fieldComponent.focus(idx)
    }
  }

  function buildRows(){
    return modelX.rows.map((row,idx) => {
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
              onClick={handleClick}
              onCommit={handleCommit}
              onFocusControl={handleFocus}
              onKeyDown={handleKeyDown}
              render={renderCallback} />
          )}
        </Row>
      )
    })

  }

  return (
      <div className="leggy-form">
        <div className="add-leg-bar"><span>+</span></div>
        {buildRows()}
      </div>
  );

}