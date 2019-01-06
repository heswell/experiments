export const TEXT_INPUT = 'TextInput'

const getLegValue = id => (model, i) => model.legs[i][id] || ''

export const TEXT = 'TextInput'
export const SELECT = 'Select'
export const COMBO = 'Combo'
export const DATE = 'Date';

export const MultiCellEdit = 'multi-cell-edit'
export const EditReadOnly = 'edit-readonly'  
export const EditEmpty = 'edit-empty'
export const SingleCellEdit = 'single-cell-edit'  

const Field1 = {
  id: 'field1',
  label: 'Field 1',
  getValue: getLegValue('field1'),
  type: TEXT,
  layout: MultiCellEdit
}
const Field2 = {
  id: 'field2',
  label: 'Field 2 (Date)',
  getValue: getLegValue('field2'),
  type: DATE,
  layout: SingleCellEdit
}
const Field3 = {
  id: 'field3',
  label: 'Field 3',
  getValue: getLegValue('field3'),
  type: COMBO,
  layout: MultiCellEdit
}
const Field4 = {id: 'field4', label: 'Field 4', getValue: getLegValue('field4'), type: TEXT, layout: EditEmpty}
const Field5 = {id: 'field5', label: 'Field 5', getValue: getLegValue('field5'), type: TEXT, layout: MultiCellEdit}
const Field7 = {
  id: 'field7',
  label: 'Field 7 (T/C)',
  getValue: getLegValue('field7'),
  type: [TEXT, COMBO],
  layout: MultiCellEdit
}
const Field8 = {id: 'field8', label: 'Field 8', getValue: getLegValue('field8'), type: TEXT, layout: MultiCellEdit}
const Field9 = {id: 'field9', label: 'Field 9', getValue: getLegValue('field9'), type: TEXT, layout: MultiCellEdit}

const Field10 = {
  id: 'field10',
  label: 'Field 10 (D/C)',
  getValue: getLegValue('field10'),
  type: [DATE, COMBO],
  layout: MultiCellEdit
}
const Field11 = {
  id: 'field11',
  label: 'Field 11 (Txt)',
  getValue: getLegValue('field11'),
  type: TEXT,
  layout: MultiCellEdit
}

const Field12 = {
  id: 'field12',
  label: 'Field 10 (T/D/C)',
  getValue: getLegValue('field12'),
  type: [TEXT, DATE, COMBO],
  layout: SingleCellEdit
}

const Field13 = {
  id: 'field13',
  label: 'Field 13 (Txt)',
  getValue: getLegValue('field13'),
  type: TEXT,
  layout: MultiCellEdit
}


export const Empty = {id: 'empty', label: '', type: 'empty', isEmpty: true}

const leggyModel = {

  layout: {
    groups: [
      { 
        id: 'group-1',
        label: null,
        fields: [Field1, Field2, Field3, Field4, Field5]
      },
      { 
        id: 'group-2',
        label: null,
        fields: [Field7, Field8, Field9, Field10, Field11, Field12, Field13]
      }
  ]},
}

export default leggyModel;