/* global expect, describe, test */

import { Machine} from 'xstate';
import {states} from '../machines/main'
import {TEXT, COMBO} from '../fields';

// import * as StateEvt from '../state-events';

const stateOptions = {
  actions: {
    setField: (model, evt) => model.setCurrentField(evt.field),
    setNextField: (m,e) => m.setNextField(e, e.field),
    setNextCompositeField: model => model.setNextCompositeFieldType(),
    resetCompositeType: model => model.compositeFieldIdx = 0
  }
}

const compositeField = {type: [TEXT, COMBO]}

function run(actions, ctx, evt) {
  actions.forEach(action => action.exec(ctx, evt))
}

function transition(machine, s1, e, model) {
  const s2 = machine.transition(s1, e, model);
  run(s2.actions, s2.context, e);
  return s2;
}


describe('state machines',() => {

  let model;
  let nextField = {type: TEXT}

  beforeEach(() => {
    model = {
      currentField: compositeField,
      compositeFieldIdx: 0,
      nextField: () => nextField,
      nextCompositeFieldType(){
        return COMBO
      },
      setNextField: (e,field) => {
        model.currentField = nextField;
      },
      setNextCompositeFieldType: () => {
        model.compositeFieldIdx += 1
      },
      setCurrentField: (field) => {
        model.currentField = field;
      }
    }
    
  })


  test('initialstate is inactive', () => {
    const stateMachine = new Machine(states, stateOptions, model);
    expect(stateMachine.initialState.value).toEqual('inactive')
  })

  test('commit from edit first field of composite moves to edit next composite field', () => {
    const stateMachine = new Machine(states, stateOptions, model);
    const state = transition(stateMachine, {edit: {editComposite: 'textInput'}}, {type: 'commit'}, model);
    expect(state.value).toEqual({edit: {editComposite: 'selector'}})
    expect(model.compositeFieldIdx).toEqual(1)
  })

  test('tab from focus first field of composite moves to edit next composite field', () => {
    const stateMachine = new Machine(states, stateOptions, model);
    const state = transition(stateMachine, {focus: 'focusComposite'}, {type: 'tab'}, model);
    expect(state.value).toEqual({edit: {editComposite: 'selector'}})
    expect(model.compositeFieldIdx).toEqual(1)
  })

  test('tab from edit first field of composite moves to edit next composite field', () => {
    const stateMachine = new Machine(states, stateOptions, model);
    const state = transition(stateMachine, {edit: 'editComposite'}, {type: 'tab'}, model);
    expect(state.value).toEqual({edit: {editComposite: 'selector'}})
    expect(model.compositeFieldIdx).toEqual(1)
  })

  test('from inactive, click on Composite ', () => {
    const stateMachine = new Machine(states, stateOptions, model);
    const field = {
      ...compositeField
    }
    const compositeFieldIdx = 0;
    const state = transition(stateMachine, 'inactive', {type: 'click', field, compositeFieldIdx}, model);
    expect(state.value).toEqual({focus: "focusComposite"})
    expect(model.currentField).toEqual(field)
  })

  test('from focus.selector, click on same ', () => {
    const stateMachine = new Machine(states, stateOptions, model);
    const field = {type: COMBO}
    const state = transition(stateMachine, {focus:'focusSelector'}, {type: 'click', field}, model);
    expect(state.value).toEqual({edit: "editSelector"})
    expect(model.currentField).toEqual(field)
  })

  test('from edit.selector, commit ', () => {
    const stateMachine = new Machine(states, stateOptions, model);
    const state = transition(stateMachine, {edit:'editSelector'}, {type: 'commit'}, model);
    expect(state.value).toEqual({focus: "focusTextInput"})
    expect(model.currentField).toEqual(nextField)
  })

})