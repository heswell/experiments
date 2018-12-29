
import * as Evt from '../../../state-events';
import {transitionNext} from '../../machine-utils';

const state = {
    id: 'edit-text-input',
    on: {
        [Evt.ESC.type]: { target: '#focus-text-input' },
        [Evt.TAB.type]: transitionNext(),
        [Evt.ENTER.type]: transitionNext()
    }
}

export default state
