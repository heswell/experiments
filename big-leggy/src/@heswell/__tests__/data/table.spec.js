/*global describe test expect */
import {_getTestTable, _getInstrumentPricesTable} from './testData';

describe('Table', () => {

    describe('data loading', () => {

        test('load data from array', () => {
            const table = _getTestTable();
            expect(table.rows).toEqual([
                [ 0,'key01', 'key01', 'G1', 'U2', 'T3', 5, 101 ],
                [ 1,'key02', 'key02', 'G1', 'U2', 'T3', 5, 102 ],
                [ 2,'key03', 'key03', 'G1', 'U2', 'T4', 4, 100 ],
                [ 3,'key04', 'key04', 'G1', 'U2', 'T4', 5, 99 ],
                [ 4,'key05', 'key05', 'G1', 'I2', 'T3', 9, 100 ],
                [ 5,'key06', 'key06', 'G1', 'I2', 'T3', 5, 45 ],
                [ 6,'key07', 'key07', 'G1', 'I2', 'T4', 1, 100 ],
                [ 7,'key08', 'key08', 'G1', 'I2', 'T5', 5, 102 ],
                [ 8,'key09', 'key09', 'G2', 'U2', 'T3', 5, 100 ],
                [ 9,'key10', 'key10', 'G2', 'U2', 'T3', 5, 100 ],
                [ 10,'key11', 'key11', 'G2', 'I2', 'T3', 5, 100 ],
                [ 11,'key12', 'key12', 'G2', 'I2', 'T3', 5, 100 ],
                [ 12,'key13', 'key13', 'G2', 'O2', 'T3', 5, 100 ],
                [ 13,'key14', 'key14', 'G2', 'O2', 'T3', 5, 100 ],
                [ 14,'key15', 'key15', 'G2', 'O2', 'T3', 5, 100 ],
                [ 15,'key16', 'key16', 'G2', 'O2', 'T3', 5, 100 ],
                [ 16,'key17', 'key17', 'G3', 'E2', 'T3', 5, 110 ],
                [ 17,'key18', 'key18', 'G3', 'E2', 'T3', 5, 101 ],
                [ 18,'key19', 'key19', 'G3', 'E2', 'T3', 5, 100 ],
                [ 19,'key20', 'key20', 'G3', 'E2', 'T3', 5, 104 ],
                [ 20,'key21', 'key21', 'G3', 'A2', 'T3', 5, 100 ],
                [ 21,'key22', 'key22', 'G3', 'A2', 'T3', 5, 95 ],
                [ 22,'key23', 'key23', 'G3', 'I2', 'T3', 5, 94 ],
                [ 23,'key24', 'key24', 'G3', 'O2', 'T3', 5, 100 ]
            ]);

            expect(table.inputColumnMap).toEqual({
                'Key Col': 0, 'Group 1': 1, 'Group 2': 2, 'Group 3': 3, Price: 4, Qty: 5
            });

            expect(table.outputColumnMap).toEqual({
                'Key Col': 2, 'Group 1': 3, 'Group 2': 4, 'Group 3': 5, Price: 6, Qty: 7
            });

            expect(table.index).toEqual({
                key01: 0, key02: 1, key03: 2, key04: 3,
                key05: 4, key06: 5, key07: 6, key08: 7,
                key09: 8, key10: 9, key11: 10, key12: 11,
                key13: 12, key14: 13, key15: 14, key16: 15,
                key17: 16, key18: 17, key19: 18, key20: 19,
                key21: 20, key22: 21, key23: 22, key24: 23
            })

            // console.log(table.columns);
            expect(table.status).toBe('ready');
        });

        test('load data from json', () => {
            const table = _getInstrumentPricesTable();
            expect(table.outputColumnMap).toEqual({
                'ric': 2, 'description': 3, 'currency': 4, 'exchange': 5, 'lotsize': 6
            });
        });
    })

    describe('insert', () => {
        test.only('insert row', (done) => {
            const table = _getTestTable();
            table.on('rowInserted', (evtType, idx, row) => {
                expect(table.rows[idx]).toEqual(row)
                expect(row[0]).toEqual(24);
                expect(row[1]).toEqual('key25');
                done()
            });
            table.insert([ 'key25', 'G3', 'O2', 'T3', 5, 100 ]);
        })
    });

    describe('update', () => {
        test('update row', (done) => {
            const table = _getTestTable();
            table.on('rowUpdated', (evtType, idx, updates) => {
                expect(table.rows[4]).toEqual([4,'key05','key05','G1','I2','T3',9.5,50])
                expect(updates).toEqual([6,9,9.5,7,100,50])
                done()
            });
            table.update(4, 4, 9.5, 5, 50);
        })
    });
});
