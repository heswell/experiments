import * as Evt from '../../state-events';
import {navigationEvents, clickAnyField} from '../machine-utils';
import focusTextInput from './textInput/focus-textInput'
import focusSelect from './select/focus-select'
import focusCombo from './combo/focus-combo'
import focusComposite from './composite/focus-composite'

const state ={
    id: 'cell-focussed',
    on: {
        [Evt.BLUR.type]: '#inactive',
        ...navigationEvents(),
        [Evt.CLICK.type]: clickAnyField()
    },
    states: {
        focusTextInput,
        focusSelect,
        focusCombo,
        focusComposite
    }
}

export default state;