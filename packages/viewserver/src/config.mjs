import { Instruments, InstrumentPrices, OrderBlotter/*, OrderBook, Simpsons,, TestTable */} from '../dataTables';
import {ServiceDefinition as DataTableService} from './services/dataTableServiceDefinition.js';

export const config = {
    services: [
        DataTableService
    ],
    DataTables: [
        Instruments,
        // Sets,
        OrderBlotter,
        // OrderBook
        InstrumentPrices,
        // TestTable,
        // CreditMatrix,
        Simpsons
    ]
};
