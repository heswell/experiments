import Table from '../../data/store/table'
import { toColumn } from '../../data/store/columnUtils';

import Rowset from '../../data/store/rowSet';
import {Instruments} from '../../viewserver/dataTables';
import instrumentData from '../../viewserver/dataTables/instruments/dataset.js';
const { performance } = require('perf_hooks');

global.performance = performance;

const DEFAULT_OFFSET = 100;

// column defs for table creation
export const _table_columns = [
    { name: 'Key Col', key: 0 },
    { name: 'Group 1', key: 1 },
    { name: 'Group 2', key: 2 },
    { name: 'Group 3', key: 3 },
    { name: 'Price', key: 4 },
    { name: 'Qty', key: 5 }
];

export const _rowset_columns = [
    { name: 'Key Col' },
    { name: 'Group 1' },
    { name: 'Group 2' },
    { name: 'Group 3' },
    { name: 'Price' },
    { name: 'Qty' }
];

export const _rowset_columns_with_aggregation = [
    { name: 'Key Col' },
    { name: 'Group 1' },
    { name: 'Group 2' },
    { name: 'Group 3' },
    { name: 'Price', aggregate: 'avg' },
    { name: 'Qty', aggregate: 'sum' }
];

export const _data = [
    ['key01', 'G1', 'U2', 'T3', 5, 101],
    ['key02', 'G1', 'U2', 'T3', 5, 102],
    ['key03', 'G1', 'U2', 'T4', 4, 100],
    ['key04', 'G1', 'U2', 'T4', 5, 99],
    ['key05', 'G1', 'I2', 'T3', 9, 100],
    ['key06', 'G1', 'I2', 'T3', 5, 45],
    ['key07', 'G1', 'I2', 'T4', 1, 100],
    ['key08', 'G1', 'I2', 'T5', 5, 102],

    ['key09', 'G2', 'U2', 'T3', 5, 100],
    ['key10', 'G2', 'U2', 'T3', 5, 100],
    ['key11', 'G2', 'I2', 'T3', 5, 100],
    ['key12', 'G2', 'I2', 'T3', 5, 100],
    ['key13', 'G2', 'O2', 'T3', 5, 100],
    ['key14', 'G2', 'O2', 'T3', 5, 100],
    ['key15', 'G2', 'O2', 'T3', 5, 100],
    ['key16', 'G2', 'O2', 'T3', 5, 100],
    ['key17', 'G3', 'E2', 'T3', 5, 110],
    ['key18', 'G3', 'E2', 'T3', 5, 101],
    ['key19', 'G3', 'E2', 'T3', 5, 100],
    ['key20', 'G3', 'E2', 'T3', 5, 104],
    ['key21', 'G3', 'A2', 'T3', 5, 100],
    ['key22', 'G3', 'A2', 'T3', 5, 95],
    ['key23', 'G3', 'I2', 'T3', 5, 94],
    ['key24', 'G3', 'O2', 'T3', 5, 100]
]

export const GROUP_COL_1 = ['Group 1','asc'];
export const GROUP_COL_2 = ['Group 2','asc'];
export const GROUP_COL_3 = ['Group 3','asc'];

export function _get_data() {
    return _data.map(d => d.slice())
}

export function _getTestTable(data){
    return new Table({
        name: 'TestTable',
        primaryKey: 'Key Col',
        columns: _table_columns,
        data: data || _data.map(d => d.slice())
    });
}

export function _getTestRowset(){
    const table = _getTestTable();
    return new Rowset(table, _rowset_columns, DEFAULT_OFFSET)
}

export function getTestTableAndRowset(){
    const table = _getTestTable();
    const rowSet = new Rowset(table, _rowset_columns, DEFAULT_OFFSET);
    return [table, rowSet]
}

export function getEmptyTestTableAndRowset(){
    const table = _getTestTable([]);
    const rowSet = new Rowset(table, _rowset_columns, DEFAULT_OFFSET);
    return [table, rowSet]
}

export const extract = (lists, idx) => lists.map(list => list[idx])

export function join(arr){
    return '\n\n' + arr.join('\n');
}

export function join2(arr){
    const len = arr.length > 0 ? arr[0].length: 0;
    const PARENT_IDX = len-4;
    const IDX_POINTER = len-3;
    const FILTER_COUNT = len-2;
    const NEXT_FILTER_IDX = len-1;

    const list = arr.map(row => row.concat([
        `\tPARENT_IDX=${row[PARENT_IDX]}`,
        `\tIDX_POINTER=${row[IDX_POINTER]}`,
        `\tFILTER_COUNT=${row[FILTER_COUNT]}`,
        `\tNEXT_FILTER_IDX=${row[NEXT_FILTER_IDX]}`
    ]));

    return '\n\n' + list.join('\n');
}

export const InstrumentColumns = Instruments.columns.map(toColumn);

// TODO check tests using this - thye are using the same table
export const _getInstrumentTable = () => new Table({
    name: 'Instruments',
    primaryKey: Instruments.primaryKey,
    columns: Instruments.columns,
    data: instrumentData
});

export function _getInstrumentRowset(){
    const table = _getInstrumentTable();
    return new Rowset(table, InstrumentColumns, 100)
}
