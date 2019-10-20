import { Instruments, InstrumentPrices/*, Sets, OrderBlotter, OrderBook, TestTable, CreditMatrix */} from '../dataTables';
import {ServiceDefinition as DataTableService} from './services/dataTableServiceDefinition';

export const config = {
    services: [
        DataTableService
    ],
    DataTables: [
        Instruments,
        // Sets,
        // OrderBlotter,
        // OrderBook
        InstrumentPrices,
        // TestTable,
        // CreditMatrix
    ]
};
