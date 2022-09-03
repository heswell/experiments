import fs from "fs";
const data_path = fs.realpathSync(process.cwd());
const project_path = "src/@heswell/viewserver/dist/dataTables/sets";
const config = {
  name: "Sets",
  dataPath: `${data_path}/${project_path}/dataset.js`,
  type: "vs",
  primaryKey: "ISIN",
  columns: [
    { name: "Segment" },
    { name: "Sector" },
    { name: "Issuer Name" },
    { name: "ISIN" },
    { name: "Sedol" },
    { name: "Security Type" },
    { name: "Currency" },
    { name: "Trading Parameter Code" },
    { name: "Price Tick Table ID" },
    { name: "Country of Register" },
    { name: "Mnemonic" },
    { name: "Short Name" },
    { name: "Long Name" },
    { name: "EMS" },
    { name: "Max Spread Floor" },
    { name: "Max Spread Perc." },
    { name: "Issuer Version Start Date" },
    { name: "Bid" },
    { name: "Ask" },
    { name: "Last" },
    { name: "Bid Vol" },
    { name: "Ask Vol" }
  ]
};
var sets_default = config;
export {
  sets_default as default
};
//# sourceMappingURL=index.js.map
