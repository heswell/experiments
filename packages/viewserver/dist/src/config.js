import {
  Instruments,
  InstrumentPrices,
  OrderBlotter
} from "../dataTables/index.js";
import { ServiceDefinition as DataTableService } from "./services/DataTableServiceDefinition.js";
const config = {
  services: [DataTableService],
  DataTables: [Instruments, OrderBlotter, InstrumentPrices]
};
export {
  config
};
//# sourceMappingURL=config.js.map
