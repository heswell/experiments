import fs from "fs";
const data_path = fs.realpathSync(process.cwd());
const project_path = "src/@heswell/viewserver/dist/dataTables/order-book";
const config = {
  name: "order-book",
  dataPath: `${data_path}/${project_path}/dataset.js`,
  type: "vs",
  primaryKey: "Id",
  columns: [
    { name: "Id" },
    { name: "ISIN" },
    { name: "Level" },
    { name: "Bid" },
    { name: "Bid Volume" },
    { name: "Bid Party" },
    { name: "Ask" },
    { name: "Ask Volume" },
    { name: "Ask Party" },
    { name: "timestamp" }
  ]
};
var order_book_default = config;
export {
  order_book_default as default
};
//# sourceMappingURL=index.js.map
