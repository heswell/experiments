import { columns } from "./columns";
function updateRow(idx, row, columnMap) {
  const FIELD_UPDATE_FREQ = 0.3;
  let updates = [];
  for (let ii = 0; ii < columns.length; ii++) {
    if (columns[ii].type === "number" && Math.random() > 1 - FIELD_UPDATE_FREQ) {
      let direction = Math.random() > 0.5 ? 1 : -1;
      updates.push(ii, row[ii] * (1 + direction * Math.random() / 10));
    }
  }
  if (updates.length) {
    return updates;
  }
}
export {
  updateRow
};
//# sourceMappingURL=update-row.js.map
