import * as Evt from '../../state-events';
import {transitionNext, clickAnyField, canNavigate} from '../machine-utils';
import focusTextInput from './textInput/focus-textInput'
import focusSelect from './select/focus-select'
import focusSelector from './selector/focus-selector'
import focusComposite from './composite/focus-composite'

const state ={
    id: 'cell-focussed',
    on: {
        [Evt.TAB.type]: transitionNext(),
        [Evt.UP.type]: transitionNext([], canNavigate),
        [Evt.DOWN.type]: transitionNext([], canNavigate),
        [Evt.ENTER.type]: transitionNext([], canNavigate),
        [Evt.RIGHT.type]: transitionNext([], canNavigate),
        [Evt.LEFT.type]: transitionNext([], canNavigate),
        [Evt.CLICK.type]: clickAnyField()
    },
    states: {
        focusTextInput,
        focusSelect,
        focusSelector,
        focusComposite
    }
}

export default state;