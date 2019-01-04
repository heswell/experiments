
import * as Evt from '../state-machinery/state-events';
import {Empty, EditEmpty, SingleCellEdit, EditReadOnly} from './form-config';

const UP = Evt.UP.type;
const DOWN = Evt.DOWN.type;
const TAB = Evt.TAB.type;
const LEFT = Evt.LEFT.type;
const RIGHT = Evt.RIGHT.type;
const ENTER = Evt.ENTER.type;
const COMMIT = Evt.COMMIT.type;

const DEFAULT_DIRECTION = {type: DOWN};

export default class LeggyModel {

  constructor(config, legCount){
    this.config = config;
    this.rows = [];
    this.legCount = legCount;
    this.fields = [];
    this.previousField = null;
    this.currentField = null;
    this.compositeFieldIdx = -1;
  }

  buildFieldList(){

    const {layout: {groups}} = this.config;
    const results = [];
    let tabIdx = 1;
    let legs = this.legCount;

    groups.forEach((group,idx) => {
      if (idx !== 0){
        results.push({
          label: false, isEmpty: true, fields: [{type:'empty', isEmpty: true}]
        })
      }
      group.fields.forEach(field => {
        const row = {
          label: field.label,
          fields: expandField(field, tabIdx, legs) 
        };
        results.push(row);
        tabIdx += row.fields.length;
        row.fields.forEach(field => this.fields[field.tabIdx] = field)
      })
    })
    return this.rows = results;
  }

    // TODO this is called frequently for same field - memoize
  //TODO when navigation up/down, preserve the column being
  // navigated when we move into and out of col spanning cells
  nextField(evt=DEFAULT_DIRECTION, field=this.currentField, field2=field){
    // console.log(`[leggy-model] nextField (currentField=${field.id}) ${evt.type}`)
    const {type} = evt;
    const {rows} = this;
    const [rowIdx, colIdx] = findField(field, rows);

    if (type === DOWN || type === TAB || type === UP || type === ENTER || type === COMMIT){
      const row = nextRow(rows, rowIdx, type);
      if (row){
        let {fields: nextFields} = row;
        if (nextFields.length === 1){
          return nextFields[0];
        } else {
          const next = nextFields[colIdx];
          if (next.isEmpty || next.isReadOnly){
            return this.nextField(evt, next, field2);
          } else {
            return next;
          }
        }
      }
    } else if (type === LEFT || type === RIGHT){
      const {fields} = rows[rowIdx];
      const next = _nextField(fields, colIdx, type);
      if (next){
        return next;
      }
    }
    return field2;
  }

  compositeFieldType(field=this.currentField){
    // console.log(`compositeFieldType ${JSON.stringify(field)} compositeFieldIdx=${this.compositeFieldIdx}`);
    return field.type[this.compositeFieldIdx];
  }

  nextCompositeFieldType(field=this.currentField){
    const {type} = field;
    if (Array.isArray(type)){
      // console.log(`nextCompositeFieldType for field ${JSON.stringify(field)} compositeIdx=${this.compositeFieldIdx} ${type[this.compositeFieldIdx+1]}`)
      return type[this.compositeFieldIdx+1];
    }
    // console.log(`nextCompositeFieldType for field ${JSON.stringify(field)} compositeIdx=${this.compositeFieldIdx} UNDEFINED`)
  }

  resetCompositeFieldType(){
    console.log(`resetCompositeFieldIdx to -1`)
    this.compositeFieldIdx = -1;
  }

  setNextCompositeFieldType(){
    console.log(`setCompositeFieldType to ${this.compositeFieldIdx+1}`)
    this.compositeFieldIdx += 1;
  }

  setNextField(evt=DEFAULT_DIRECTION, field=this.currentField, field2=field){
    return this.setCurrentField(this.nextField(evt, field, field2))
  }
  setCurrentField(field, idx=null){
    if (field !== this.currentField){
      console.log(`[leggy-model] setCurrentField ${field.id} (${field.type}) idx=${idx}`)
      this.previousField = this.currentField
      this.currentField = field
      if (idx !== null){
        this.compositeFieldIdx = idx;
      }
    }
    return field
  }
}


function expandField(field, tabIdx, legs){
  switch (field.layout){
    
    case SingleCellEdit:
      return [{ ...field, tabIdx}]

    case EditEmpty:
      return [{ ...field, tabIdx}]
        .concat(Array(legs-1).fill(Empty));

    case EditReadOnly:
      return [{ ...field, tabIdx}]
        .concat(Array(legs-1).fill(0).map(() => ({
          ...field,
          isReadonly: true,
          tabIdx: ++tabIdx
        })));

    default:
      return Array(legs).fill(0).map(() => ({
        ...field,
        tabIdx: tabIdx++
      }))
  }
}

function nextRow(rows, idx, evt=DOWN){
  const nextIdx = evt === DOWN || evt === TAB || evt === ENTER || evt === COMMIT
    ? idx+1
    : idx-1;

  const next = rows[nextIdx];
  
  if (next === undefined){
    return null;
  } else if (next.isEmpty || next.isReadOnly){
    return nextRow(rows, nextIdx, evt);
  } else {
    return next;
  }    
}

function _nextField(fields, idx, direction=DOWN){
  const nextIdx = direction === RIGHT
    ? idx+1
    : idx-1;

  const next = fields[nextIdx];
  
  if (next === undefined){
    return null;
  } else if (next.isEmpty || next.isReadOnly){
    return _nextField(fields, nextIdx, direction);
  } else {
    return next;
  }    
}

function findField(field, rows){
  for (let i=0;i<rows.length;i++){
    const {fields} = rows[i];
    for (let j=0;j<fields.length;j++){
      if (fields[j] === field){
        return [i,j];
      }
    }
  }
}