import * as Evt from '../../../state-events';

const state = {
    id: 'edit-select',
    on: {
        [Evt.ESC.type]: { target: '#focus-select' },
        [Evt.COMMIT.type]: { target: '#next' }
    }
}

export default state;