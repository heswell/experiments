import * as Evt from '../../../state-events';
import {transitionNext} from '../../machine-utils';

const state = {
    id: 'edit-selector',
    on: {
        [Evt.ESC.type]: { target: '#focus-selector' },
        [Evt.COMMIT.type]: transitionNext()
        // [Evt.ENTER.type]: transitionNext(['commit'])

    }
}

export default state;