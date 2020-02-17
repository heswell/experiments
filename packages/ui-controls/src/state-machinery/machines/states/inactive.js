import * as Evt from '../../state-events';
import {transitionNext, clickAnyField} from '../machine-utils';

const state = {
    id : 'inactive',
    onEntry: 'resetField',
    on: {
        [Evt.TAB.type]: transitionNext(),
        [Evt.CLICK.type]: clickAnyField()
    }
}

export default state;