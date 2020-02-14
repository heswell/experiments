
import { EditEmpty, MultiCellEdit, SingleCellEdit, EditReadOnly} from '@heswell/ui-controls';

export const TEXT_INPUT = 'TextInput';
export const SELECT = 'Select';
export const COMBO = 'Combo';
export const DATE = 'Date';


const getLegValue = id => (model, i) => model.legs[i][id] || ''
const getCompositeLegValue = id => (model, legIdx, compositeIdx) => {
  const leg = model.legs[legIdx];
  if (leg){
    const value = leg[id];
    if (Array.isArray(value)){
      return value[compositeIdx] === undefined ? '' : value[compositeIdx];  
    }
  }
  return '';
}

export const TEXT = 'TextInput'

const Field1 = {
  id: 'field01',
  label: 'Field 1 TXT*',
  getValue: getLegValue('field01'),
  type: TEXT,
  layout: MultiCellEdit
}
const Field2 = {
  id: 'field02',
  label: 'Field 2 TXT',
  getValue: getLegValue('field02'),
  type: TEXT,
  layout: SingleCellEdit
}
const Field3 = {
  id: 'field03',
  label: 'Field 3 COM*',
  getValue: getLegValue('field03'),
  type: DATE,
  layout: MultiCellEdit
}
const Field4 = {
  id: 'field04',
  label: 'Field 4 TXT*',
  getValue: getLegValue('field04'),
  type: TEXT,
  layout: EditEmpty
}

const Field5 = {
  id: 'field05',
  label: 'Field 5 TXT*',
  getValue: getLegValue('field05'),
  type: TEXT,
  layout: MultiCellEdit
}
const Field7 = {
  id: 'field07',
  label: 'Field 7 T/T*',
  getValue: getCompositeLegValue('field07'),
  type: [TEXT, TEXT],
  layout: MultiCellEdit
}
const Field8 = {id: 'field08', label: 'Field 8 TXT*', getValue: getLegValue('field08'), type: TEXT, layout: MultiCellEdit}
const Field9 = {id: 'field09', label: 'Field 9 TXT*', getValue: getLegValue('field09'), type: TEXT, layout: MultiCellEdit}

const Field10 = {
  id: 'field10',
  label: 'Field 10 (T/T)',
  getValue: getCompositeLegValue('field10'),
  type: [TEXT, TEXT],
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
  label: 'Field 10 (T/T/T)',
  getValue: getCompositeLegValue('field12'),
  type: [TEXT, TEXT, TEXT],
  layout: SingleCellEdit
}

const Field13 = {
  id: 'field13',
  label: 'Field 13 (T or T)',
  getValue: getLegValue('field13'),
  type: TEXT,
  // TODO not sure if this gets copied when we use spread
  getType(model){
    return model.field11 === 'a'
      ? (this.type = TEXT)
      : (this.type = TEXT)
    },
  layout: MultiCellEdit
}

const Field14 = {
  id: 'field14',
  label: 'Field 14 (TXT)',
  getValue: getLegValue('field13'),
  type: TEXT,
  layout: MultiCellEdit
}

const Field15 = {
  id: 'field15',
  label: 'Field 15 (Txt)',
  getValue: getLegValue('field15'),
  type: TEXT,
  layout: MultiCellEdit
}

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
        fields: [Field7, Field8, Field9, Field10, Field11, Field12, Field13, Field14, Field15]
      }
  ]},
}

export default leggyModel;