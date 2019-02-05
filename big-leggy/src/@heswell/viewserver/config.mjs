import { Instruments/*, InstrumentPrices, TestTable, CreditMatrix */} from './dataTables';
import DataTableService from './services/dataTableService';

export const config = {
    services: [
        DataTableService
    ],
    DataTables: [
        Instruments
        // InstrumentPrices,
        // TestTable,
        // CreditMatrix
    ]
};
