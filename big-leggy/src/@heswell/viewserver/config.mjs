import { Instruments, Sets, OrderBlotter, OrderBook /*, InstrumentPrices, TestTable, CreditMatrix */} from './dataTables';
import DataTableService from './services/dataTableService';

export const config = {
    services: [
        DataTableService
    ],
    DataTables: [
        Instruments,
        Sets,
        OrderBlotter,
        OrderBook
        // InstrumentPrices,
        // TestTable,
        // CreditMatrix
    ]
};
