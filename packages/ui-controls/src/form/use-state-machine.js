import {useRef} from 'react';
import { Machine} from 'xstate';
import * as StateEvt from '../state-machinery/state-events';

export default function(states, ctx, dispatch){
  const stateMachine = useRef(new Machine(states, null, ctx));
  const state = useRef(stateMachine.current.initialState);

  function stateTransition(evt){

    if (state.current.event === StateEvt.TAB && evt.type === 'commit'){
      // ignore
    } else {
      console.group(`%c${evt.type} => from ${JSON.stringify(state.current.value)}  target=[${evt.compositeFieldIdx}]`, 'color: blue;font-weight: bold;')
      const s2 = state.current = stateMachine.current.transition(state.current, evt);
      s2.actions.forEach(({type}) => dispatch({type, evt}));
      console.log(`%c    => ${JSON.stringify(state.current.value)} [${state.current.context.compositeFieldIdx}]`, 'color: blue;font-weight: bold;');
      console.groupEnd();
    }
  }

  return [state, stateTransition];
}