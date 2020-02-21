import React, { useRef } from 'react';
import cx from 'classnames';
import { Machine} from 'xstate';
import {states} from '../state-machinery/machines/main'
import * as StateEvt from '../state-machinery/state-events';
import {FormModel} from './form-model';
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
        setField: (model, evt) => {
          const {field, compositeFieldIdx: idx=0} = evt;
          console.log(`%c[action] setField [${idx}]`,'color: brown; font-weight: bold');
          setCurrentField(model.setCurrentField(field, idx),idx);
        },
        setNextField: (model, evt) => {
          console.log(`%c[action] setCurrentField`,'color: brown; font-weight: bold');
          setCurrentField(model.setNextField(evt, evt.field));
        },
        setNextCompositeField: model => {
          console.log(`setNextCompositeField`)
          model.setNextCompositeFieldType();
          setCompositeField();
        },
        resetField: (model) => {
          console.log(`setNextCompositeField`)
          model.currentField = null;
        },
        resetCompositeType: model => model.resetCompositeFieldType(),
        commit: (ctx) => {
            return console.log(`COMMIT changes for  ${ctx.fields[ctx.idx].name}`);
        }
    }
  }

  const formModel = useRef(new FormModel(config, 2));
  const model = formModel.current;
  const fieldRefs = useRef([]);
  const stateMachine = useRef(new Machine(states, stateOptions, model));
  const state = useRef(stateMachine.current.initialState);
  const currentField = useRef(null);

  function setRef(target){
    if (target && target.field){
      fieldRefs.current[target.field.tabIdx] = target;
    }
  }

  function handleCancel(){
    stateTransition(StateEvt.ESC);// Should be cancel
    // We may be receiving control back from focussed model, make sure focus
    // returns to same field...
    setCurrentField(model.currentField, model.compositeFieldIdx);
  }

  function handleClick(field, compositeFieldIdx){
    if (field === model.currentField && state.current.matches('focus')){
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
      console.log(`[leggy-form] handleCommit ${JSON.stringify(field)} ${model.compositeFieldIdx}`)
      // if commit was triggered by blur, because user used TAB, transition has already happened.
      stateTransition({...StateEvt.COMMIT, field});  
    }
  }

  function handleFocus(field, compositeFieldIdx=0){
    console.log(`[leggy-form] handleFocus [${compositeFieldIdx}] ${field.type} `)
    if (field !== model.currentField || compositeFieldIdx !== model.compositeFieldIdx){
        console.log(`\t...StateTransition CLICK because field ${field ? field.id : null} !== ${model.currentField ? model.currentField.id : null} 
          OR compositeFieldIdx (${compositeFieldIdx}) !== ${model.compositeFieldIdx}`)
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
    const stateEvt = getKeyboardEvent(e);
    if (stateEvt){
      const startingField = currentField.current;
      const {compositeFieldIdx} = model;
      stateTransition(stateEvt);
      // TODO how can we eliminate this logic - we need a simple indication of whether
      // key has been handled already - a model method ? 
      // Don't swallow tab if the control being edited may need it 
      const tabbed = (StateEvt.isTabNavEvt(stateEvt)) &&
        (currentField.current !== startingField ||
          compositeFieldIdx !== model.compositeFieldIdx );
      // In what scenario do we need this treatment of ESC ?
      if ((state.current.matches('focus') && stateEvt !== StateEvt.ESC) || tabbed){
        console.log(`stop event propagation`)
        e.stopPropagation();
        e.preventDefault();
      }
    }
  }

  function stateTransition(stateEvt){
    // if (stateEvt.type === 'click' && this.currentState.matches('edit')){
    //   debugger;
    // }
    console.group(`%c${stateEvt.type} => from ${JSON.stringify(state.current.value)}  target=[${stateEvt.compositeFieldIdx}]`, 'color: blue;font-weight: bold;')
    const s2 = state.current = stateMachine.current.transition(state.current, stateEvt)
    runActions(s2.actions, s2.context, stateEvt);
    console.log(`%c    => ${JSON.stringify(state.current.value)} [${state.current.context.compositeFieldIdx}]`, 'color: blue;font-weight: bold;');
    console.groupEnd();
  }

  function setCurrentField(field, idx=0){
    console.log(`[leggy-form] setCurrentField [${idx}]`)
    const fieldComponent = fieldRefs.current[field.tabIdx];
    if (fieldComponent){
      console.log(`setField focus on field ${field.id} [${idx}] IGNORE_FOCUS=true`);
      fieldComponent.focus(idx);
    }
    currentField.current = field;
  }

  function setCompositeField(field=currentField.current){
    const idx = model.compositeFieldIdx;
    const fieldComponent = fieldRefs.current[field.tabIdx];
    if (fieldComponent){
      console.log(`setCompositeField focus on composite field, tabIndex ${field.tabIdx} [${idx}] IGNORE_FOCUS=true`);
      fieldComponent.focus(idx)
    }
  }

  function buildRows(model){
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
        {buildRows(model)}
      </div>
  );

}