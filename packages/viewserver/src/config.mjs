import {
  Instruments,
  InstrumentPrices,
  OrderBlotter /*, OrderBook, Simpsons,, TestTable */
} from '../dataTables/index.mjs';
import { ServiceDefinition as DataTableService } from './services/DataTableServiceDefinition.js';

export const config = {
  services: [DataTableService],
  DataTables: [Instruments, OrderBlotter, InstrumentPrices]
};
