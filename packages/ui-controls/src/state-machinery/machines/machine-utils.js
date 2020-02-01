import {TEXT, SELECT, COMBO, DATE, TOGGLE} from '../fields';
import * as Evt from '../state-events';

export const isComposite = field => {
    return Array.isArray(field.type)
}

export const isComboType = fieldType => fieldType === COMBO || fieldType === DATE

export const isToggle = field => field.type === TOGGLE
export const isTextInput = field => field.type === TEXT
export const isSelect = field => field.type === SELECT
export const isCombo = field => isComboType(field.type)
export const canNavigate = (model, evt) => model.nextField(evt) !== model.currentField


export const nextIdx2 = ({ idx2 }) => idx2 + 1;
export const isFirstIndex = (ctx) => ctx.idx === 0;
export const isLastIndex = (ctx) => ctx.idx === ctx.model.fields.length - 1;
export const isLastIndex2 = (ctx) => {
    // console.log(`isLastIndex2 idx:${ctx.idx} idx2:${ctx.idx2}`)
    return ctx.idx2 === ctx.model.fields[ctx.idx].type.length - 1;
}

export function prevIdx({ idx, fields }) {
    if (idx === -1) {
        return fields.length - 1;
    } else {
        return idx - 1;
    }
}

const alwaysTrue = () => true

export const navigationEvents = () => ({
    [Evt.TAB.type]: transitionNext(),
    [Evt.TAB_BWD.type]: transitionNext(),
    [Evt.UP.type]: transitionNext([], canNavigate),
    [Evt.DOWN.type]: transitionNext([], canNavigate),
    [Evt.ENTER.type]: transitionNext([], canNavigate),
    [Evt.LEFT.type]: transitionNext([], canNavigate),
    [Evt.RIGHT.type]: transitionNext([], canNavigate)
})

export const transitionNext = (actions=[], cond= alwaysTrue) => [
    { target: '#inactive', cond: (c,e) => cond(c,e) && !c.nextField(e)},
    { target: '#focus-composite', actions: actions.concat('setNextField'), cond: (c,e) => cond(c, e) && isComposite(c.nextField(e))},
    { target: '#focus-text-input', actions: actions.concat('setNextField'), cond: (c,e) => cond(c, e) && isTextInput(c.nextField(e))},
    { target: '#focus-select', actions: actions.concat('setNextField'), cond: (c,e) => cond(c, e) && isSelect(c.nextField(e))},
    { target: '#focus-combo', actions: actions.concat('setNextField'), cond: (c,e) => cond(c, e) && isCombo(c.nextField(e))},
    { target: '#edit-toggle', actions: actions.concat('setNextField'), cond: (c,e) => cond(c, e) && isToggle(c.nextField(e))}
]

export const transitionNextComposite = () => [
    ...transitionNext(['resetCompositeType'],c => !c.nextCompositeFieldType()),
    { target: '#focus-composite', actions: ['setNextCompositeField'] }
    // { target: '#edit-composite-text-input', actions: ['setNextCompositeField'], cond: c => c.nextCompositeFieldType() === TEXT },
    // { target: '#edit-composite-select', actions: ['setNextCompositeField'], cond: c => c.nextCompositeFieldType() === SELECT },
    // { target: '#edit-composite-selector', actions: ['setNextCompositeField'], cond: c => isComboType(c.nextCompositeFieldType()) }
]

export const focusComposite = () => [
    { target: '#focus-composite', actions: ['setField'], cond: (c,e) => e.field.type[e.compositeFieldIdx] === TEXT },
    { target: '#edit-composite-select', actions: ['setField'], cond: (c,e) => e.field.type[e.compositeFieldIdx] === SELECT },
    { target: '#edit-composite-combo', actions: ['setField'], cond: (c,e) => isComboType(e.field.type[e.compositeFieldIdx]) }
]

export const clickAnyField = () => [
    { target: '#edit-toggle', actions: ['setField'], cond: (_, evt) => isToggle(evt.field)},
    { target: 'focus.focusTextInput', actions: ['setField'], cond: (_, evt) => isTextInput(evt.field)},
    { target: 'edit.editSelect', actions: ['setField'], cond: (_, evt) => isSelect(evt.field)},
    { target: 'edit.editCombo', actions: ['setField'], cond: (_, evt) => isCombo(evt.field)},
    ...focusComposite()
]
