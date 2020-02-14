import * as Evt from '../../state-events';
import {transitionNext, clickAnyField, focusAnyField} from '../machine-utils';

const state = {
    id : 'inactive',
    onEntry: 'resetField',
    on: {
        [Evt.TAB.type]: transitionNext(), // won't be needed, focus covers it
        [Evt.CLICK.type]: clickAnyField(),
        [Evt.FOCUS.type]: focusAnyField()
    }
}

export default state;