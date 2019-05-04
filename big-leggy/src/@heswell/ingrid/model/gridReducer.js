import * as Grid from './actions';
import modelReducer, {initialize, DEFAULT_MODEL_STATE} from './modelReducer';
import * as Action from './actions';

export function init({data, model}){
  return {
      data,
      model: initialize(DEFAULT_MODEL_STATE, {type: Grid.INITIALIZE, gridState: model})
  }
}

export default function ({data, model}, action){
  console.log(`gridReducer ${action.type}`)  
  if (action.type === 'data'){
      const {IDX, SELECTED} = model.meta;
      const {rows, rowCount} = action;
      const selected = rows.filter(row => row[SELECTED]).map(row => row[IDX])
      return { 
          data: { rows, rowCount, selected }, 
          model: rowCount === data.rowCount
              ? model
              : modelReducer(model, { type: Action.ROWCOUNT, rowCount })
      }
  } else {
      return {
          data,
          model: modelReducer(model, action)
      }
  }
}
