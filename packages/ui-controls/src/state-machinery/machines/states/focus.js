import * as Evt from '../../state-events';
import {navigationEvents, clickAnyField} from '../machine-utils';
import focusTextInput from './textInput/focus-textInput'
import focusSelect from './select/focus-select'
import focusSelector from './selector/focus-selector'
import focusComposite from './composite/focus-composite'

const state ={
    id: 'cell-focussed',
    on: {
        ...navigationEvents(),
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