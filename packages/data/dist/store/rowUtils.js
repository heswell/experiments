function isEmptyRow(row) {
  return row[0] === void 0;
}
function indexRows(rows, indexField) {
  return addRowsToIndex(rows, {}, indexField);
}
function addRowsToIndex(rows, index, indexField) {
  for (let idx = 0, len = rows.length; idx < len; idx++) {
    index[rows[idx][indexField]] = idx;
  }
  return index;
}
function update(rows, updates, { IDX }) {
  const results = rows.slice();
  for (let i = 0; i < updates.length; i++) {
    const [idx, ...fieldUpdates] = updates[i];
    let row;
    for (let ii = 0; ii < rows.length; ii++) {
      if (rows[ii][IDX] === idx) {
        row = rows[ii].slice();
        for (let j = 0; j < fieldUpdates.length; j += 2) {
          row[fieldUpdates[j]] = fieldUpdates[j + 1];
        }
        results[ii] = row;
        break;
      }
    }
  }
  return results;
}
function emptyRow(idx, { IDX, count }) {
  const row = Array(count);
  row[IDX] = idx;
  return row;
}
function arrayOfIndices(length) {
  const result = Array(length);
  for (let i = 0; i < length; i++) {
    result[i] = i;
  }
  return result;
}
export {
  addRowsToIndex,
  arrayOfIndices,
  indexRows,
  isEmptyRow,
  update
};
//# sourceMappingURL=rowUtils.js.map
