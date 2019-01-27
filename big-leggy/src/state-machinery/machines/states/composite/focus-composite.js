
import * as Evt from '../../../state-events';
import {TEXT} from '../../../fields';

import {transitionNextComposite, isComboType, isSelect} from '../../machine-utils';

const state = {
    id: 'focus-composite',
    on: {
        [Evt.ENTER.type]: [
            { target: '#edit-composite-selector', cond: c => isComboType(c.currentField.type[c.compositeFieldIdx]) },
            { target: '#edit-composite-select', cond: c => isSelect(c.currentField.type[c.compositeFieldIdx]) },
            ...transitionNextComposite()
        ],
        [Evt.TAB.type]: transitionNextComposite(),
        [Evt.TEXT.type]: { target: '#edit-composite-text-input', cond: c =>  c.compositeFieldType() === TEXT}
    }

}

export default state
