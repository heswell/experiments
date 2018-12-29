import * as Evt from '../../../state-events';
import {transitionNextComposite} from '../../machine-utils';

const state = {
    id: 'edit-composite',
    initial: 'unknown',
    on: {
        [Evt.TAB.type]: transitionNextComposite(),
    },
    states: {
        textInput: {
            id: 'edit-composite-text-input',
            on: {
                [Evt.COMMIT.type]: transitionNextComposite()
            }
        },
        select: {
            id: 'edit-composite-select',
            on: {
                [Evt.COMMIT.type]: transitionNextComposite()
            }
        },
        selector: {
            id: 'edit-composite-selector',
            on: {
                [Evt.COMMIT.type]: transitionNextComposite()
            }
        },
        unknown: {}
    }
}

export default state;