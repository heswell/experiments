import path from "path";
import fs from "fs";
const path_root = "node_modules/@heswell/viewserver/dist/dataTables";
const project_path = path.resolve(fs.realpathSync("."), `${path_root}/order-blotter`);
const config = {
  name: "OrderBlotter",
  dataPath: `${project_path}/dataset.js`,
  createPath: `${project_path}/create-row.js`,
  type: "vs",
  primaryKey: "OrderId",
  columns: [
    { name: "OrderId" },
    { name: "Status" },
    { name: "Direction" },
    { name: "ISIN" },
    { name: "Quantity", type: "number", aggregate: "sum" },
    { name: "Price" },
    { name: "Currency" },
    { name: "timestamp" }
  ],
  updates: {
    applyInserts: true,
    insertInterval: 100,
    applyUpdates: false,
    interval: 1e3,
    fields: ["Quantity"]
  }
};
var order_blotter_default = config;
export {
  order_blotter_default as default
};
//# sourceMappingURL=index.js.map
