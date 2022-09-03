import path from "path";
import url from "url";
const ServerApiMessageTypes = {
  addSubscription: "AddSubscription"
};
const data_path = path.dirname(new url.URL(import.meta.url).pathname);
const ServiceDefinition = {
  name: "DataTableService",
  module: `${data_path}/DataTableService.js`,
  API: [
    "HB_RESP",
    "GET_TABLE_LIST",
    "GET_TABLE_META",
    "CREATE_VP",
    "TerminateSubscription",
    "setViewRange",
    "GetFilterData",
    "GetSearchData",
    "ModifySubscription",
    "InsertTableRow",
    "groupBy",
    "sort",
    "filter",
    "select",
    "selectAll",
    "selectNone",
    "setGroupState",
    "ExpandGroup",
    "CollapseGroup",
    "unsubscribeAll"
  ]
};
export {
  ServiceDefinition
};
//# sourceMappingURL=DataTableServiceDefinition.js.map
