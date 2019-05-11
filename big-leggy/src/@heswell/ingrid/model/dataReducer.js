
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