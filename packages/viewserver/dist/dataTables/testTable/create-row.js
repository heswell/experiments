import { columns } from "@heswell/viewserver/dist/dataTables/testTable/columns";
const groups = {
  group1: ["Group-1", "Group-2", "Group-3", "Group-4", "Group-5"],
  group2: ["Group-6", "Group-7", "Group-8", "Group-9", "Group-10"]
};
let incrementor = 0;
function oneOf(group, index) {
  var values = groups[group];
  if (values) {
    if (typeof index === "number") {
      return values[index];
    } else {
      var idx = parseInt(values.length * Math.random());
      return values[idx];
    }
  } else {
    return "test";
  }
}
function padLeftZero(n, places) {
  return ("000000" + n).slice(-places);
}
function defaultColumnValue(column, idx) {
  if (column.name === "Column-1") {
    const root = "Key";
    return `${root}-${padLeftZero(idx, 5)}`;
  } else if (column.name === "Column-2") {
    return `description of ${padLeftZero(idx, 5)}`;
  } else if (column.type === "number") {
    return 1e3;
  } else if (column.type === "increment") {
    return incrementor++;
  } else if (column.name === "Timestamp") {
    return new Date().toISOString();
  } else if (idx > 20 && column.name === "Column-7") {
    return oneOf("group2");
  } else if (column.value) {
    if (idx > 14) {
      return oneOf(column.value, 0);
    } else {
      return oneOf(column.value);
    }
  } else {
    return `text-${idx}`;
  }
}
function createRow(idx) {
  const row = {};
  columns.forEach((column) => {
    row[column.name] = defaultColumnValue(column, idx);
  });
  return row;
}
export {
  createRow
};
//# sourceMappingURL=create-row.js.map
