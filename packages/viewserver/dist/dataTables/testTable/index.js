import fs from "fs";
const path = fs.realpathSync(process.cwd());
const config = {
  name: "TestTable",
  dataPath: `${path}/data-generator.js`,
  createPath: `${path}/create-row.js`,
  updatePath: `${path}/update-row.js`,
  type: "vs",
  primaryKey: "Column-1",
  columns: [
    { name: "Column-1", type: "string" },
    { name: "Column-2", type: "string" },
    { name: "Column-3", type: "number" },
    { name: "Column-4", type: "number" },
    { name: "Column-5", type: "number" },
    { name: "Column-6", type: "string" },
    { name: "Column-7", type: "string", value: "group1" },
    { name: "Column-8", type: "number" },
    { name: "Column-9", type: "number" },
    { name: "Column-10", type: "number" },
    { name: "Column-11", type: "number" },
    { name: "Timestamp", type: "datetime" },
    { name: "AutoInc", type: "increment" }
  ],
  updates: {
    interval: 3e4,
    applyInserts: true,
    applyUpdates: false
  }
};
var testTable_default = config;
export {
  testTable_default as default
};
//# sourceMappingURL=index.js.map
