
// This assumes model.meta never changes. If it does (columns etc)
// we will need additional action types to update
export default function (model) {
  return (state, action) => {
    console.log(`dataReducer`, action)
    const { IDX, SELECTED } = model.meta;
    const { rows, rowCount } = action;
    const selected = rows.filter(row => row[SELECTED]).map(row => row[IDX]);
    return {
      rows, rowCount, selected
    }
  }
}


// TODO create a pool of these and reuse them
function emptyRow(idx, { IDX, count }) {
  const row = Array(count);
  row[IDX] = idx;
  return row;
}

function mergeAndPurge({ lo, hi }, rows, offset = 0, newRows, size, meta, keys) {
  // console.groupCollapsed(`mergeAndPurge range: ${lo} - ${hi} 
  //  old   rows: [${rows.length ? rows[0][7]: null} - ${rows.length ? rows[rows.length-1][7]: null}]
  //  new   rows: [${newRows.length ? newRows[0][7]: null} - ${newRows.length ? newRows[newRows.length-1][7]: null}]
  //     `);
  const { IDX, RENDER_IDX } = meta;
  const {free, used: usedKeys} = keys;
  const low = lo + offset;
  const high = Math.min(hi + offset, size + offset);
  const rowCount = hi - lo;

  let pos, row, rowIdx, rowKey;
  const results = [];
  let used = {};
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
  for (let i = 0; i < newRows.length; i++) {
    if (row = newRows[i]) {
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

  // console.table(results);
  // console.groupEnd();
  keys.used = used;
  return results;

}
