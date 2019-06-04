
export const initialData = {
  rows: [],
  rowCount: 0,
  range: {lo:0,hi:0},
  offset: 0,
  selected: [],
  _keys: {
    free: [],
    used: {}
  }
}

// This assumes model.meta never changes. If it does (columns etc)
// we will need additional action types to update
export default function (model) {
  return (state, action) => {
    if (action.type === 'range'){
      return setRange(state, action, model.meta)
    } else if (action.type === 'data'){
      return setData(state, action, model.meta)
    } else if (action.type === 'selected'){
      return applySelection(state, action, model.meta)
    }
  }
}

function setKeys(keys, {lo,hi}){
  const free = [];
  const keyCount = hi - lo;
  for (let i=0;i<keyCount;i++){
    const usedKey =  keys.used[i];
    if (usedKey === 3 || usedKey === undefined ){
      free.push(i);
    }
  }
  return {
    used: keys.used, 
    free
  }

}

//TODO we HAVE to remove out=of-range rows and add empty placeholders
function setRange(state, {range}, meta){
  // return {
  //   ...state,
  //   range,
  //   _keys: setKeys(state._keys, range)
  // }

  const { IDX, SELECTED } = meta;
  const {rows, rowCount, offset} = state;
  const keys = setKeys(state._keys, range)
  const [mergedRows, _keys] = mergeAndPurge(range, rows, offset, [], rowCount, meta, keys)
  const selected = rows.filter(row => row[SELECTED]).map(row => row[IDX]);
  return {
    rows: mergedRows,
    rowCount,
    offset,
    range,
    selected,
    _keys
  }
}

function setData(state, action, meta){
  const { IDX, SELECTED } = meta;
  const { rows, rowCount, offset } = action;
  console.log(`dataReducer current range ${state.range.lo} - ${state.range.hi} incoming range ${action.range.lo} - ${action.range.hi}`)
  const range = action.range.reset ? action.range : state.range;
  const [mergedRows, _keys] = mergeAndPurge(range, state.rows, offset, rows, rowCount, meta, state._keys)
  
  const selected = rows.filter(row => row[SELECTED]).map(row => row[IDX]);

  return {
    rows: mergedRows,
    rowCount,
    offset,
    range,
    selected,
    _keys
  }

}

function applySelection(state, {selected, deselected}, meta){
  const { IDX, SELECTED } = meta;
  const {rows: input, rowCount} = state;
  const results = [];
  const rows = [];

  // TODO whare do we apply the offset
  const offset = 100;

  for (let i=0;i<input.length;i++){
    const row = input[i];
    const rowIdx = row[IDX];
    const wasSelected = row[SELECTED];
    const nowSelected = !wasSelected && selected.includes(rowIdx-offset);
    const nowDeselected = wasSelected && deselected.includes(rowIdx-offset);

    if (!nowSelected && !nowDeselected){
      rows[i] = row;
      if (wasSelected){
        results.push(rowIdx-100);
      }
    } else {
      const dolly = row.slice();
      if (nowSelected){
        dolly[SELECTED] = 1;
        results.push(rowIdx-100);
      } else {
        dolly[SELECTED] = 0;
      }
      rows[i] = dolly;
    }
  }

  return {
    rows,
    rowCount,
    selected: results
  }
}


// TODO create a pool of these and reuse them
function emptyRow(idx, { IDX, count }) {
  const row = Array(count);
  row[IDX] = idx;
  return row;
}

function mergeAndPurge({ lo, hi }, rows, offset = 0, incomingRows, size, meta, keys) {
  // console.log(`dataReducer.mergeAndPurge: entry
  //   range ${lo} - ${hi}
  //   keys: 
  //     free: ${keys.free.join(',')}
  //     used : ${Object.keys(keys.used).join(',')}
  //     existing rows : ${rows.map(r=>r[meta.IDX]-offset).join(',')}
  //     incoming rows : ${incomingRows.map(r=>r[meta.IDX]-offset).join(',')}
  // `)

  const { IDX, RENDER_IDX } = meta;
  const {free: freeKeys, used: usedKeys} = keys;
  const low = lo + offset;
  const high = Math.min(hi + offset, size + offset);
  const rowCount = hi - lo;

  let pos, row, rowIdx, rowKey;
  const results = [];
  const used = {};
  const free = freeKeys.slice();
  // 1) iterate existing rows, copy to correct slot in results if still in range
  //    if not still in range, collect rowKey
  
  for (let i = 0; i < rows.length; i++) {
    if (row = rows[i]) {
      rowIdx = row[IDX];
      rowKey = row[RENDER_IDX];
      pos = rowIdx - low;

      if (usedKeys[rowKey] === 1 && rowIdx >= low && rowIdx < high) {
        results[pos] = rows[i];
        used[rowKey] = 1;
      } else if (usedKeys[rowKey] === 1 && rowKey < rowCount){
        free.push(rowKey);
        used[rowKey] = undefined;
      }
    }
  }

  // 2) iterate new rows, if not already in results (shouldn't be) , move to correct slot in results
  //      assign rowKey from free values
  for (let i = 0; i < incomingRows.length; i++) {
    if (row = incomingRows[i]) {
      rowIdx = row[IDX];
      pos = rowIdx - low;

      if (rowIdx >= low && rowIdx < high) {
        if (results[pos]){
          rowKey = results[pos][RENDER_IDX]
        } else {
          rowKey = free.shift();
          used[rowKey] = 1;
        }
        results[pos] = row;
        row[RENDER_IDX] = rowKey; 

      } else {
        console.warn('new row outside range')
      }
    }
  }
  // 3) assign empty row to any free slots in results
  // TODO make this more efficient
  for (let i = 0, freeIdx=0; i < rowCount; i++) {
    if (results[i] === undefined) {
      const row = results[i] = emptyRow(i + low, meta);
      rowKey = free[freeIdx++]; // don't remove from free
      row[RENDER_IDX] = rowKey; 
      used[rowKey] = 3;
    }
  }

//   console.log(`dataReducer.mergeAndPurge: exit
//   range ${lo} - ${hi}
//   keys: 
//     free: ${free.join(',')}
//     used : ${Object.keys(used).join(',')}
//     row keys : ${results.map(r=>r[RENDER_IDX]).join(',')}
// `)

  return [results,{
    free,
    used
  }];

}
