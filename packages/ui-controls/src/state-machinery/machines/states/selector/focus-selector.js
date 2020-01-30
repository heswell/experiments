import * as Evt from '../../../state-events';

const state = {
    id: 'focus-selector',
    on: {
        [Evt.TEXT.type]: { target: '#edit-selector' },
        [Evt.ENTER.type]: { target: '#edit-selector' }
    }
}

export default state;