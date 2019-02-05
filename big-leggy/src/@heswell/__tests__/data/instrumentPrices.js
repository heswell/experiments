import {getData as instrumentPrices} from '../../viewserver/dataTables/instrumentPrices/data-generator';
import {InstrumentPrices} from '../../viewserver/dataTables';
import { toColumn } from '../../data/store/columnUtils';

export const InstrumentPriceColumns = InstrumentPrices.columns.map(toColumn);

export const _getInstrumentPricesTable = async () => {

    const data = await instrumentPrices();

    return new Table({
        name: 'InstrumentPrices',
        primaryKey: InstrumentPrices.primaryKey,
        columns: InstrumentPrices.columns,
        data
    });
}
