/*global describe test expect */
import InMemoryView from '../../../data/store/InMemoryView';
import { DataTypes } from '../../../data/store/types'
import { SET, INCLUDE, EXCLUDE, STARTS_WITH } from '../../../data/store/filter'

import { _getTestTable, _rowset_columns, _getInstrumentTable, InstrumentColumns as columns, join,pluck } from '../testData'

describe('construction', () => {
    test('construction', () => {
        let view = new InMemoryView(_getInstrumentTable(), { columns });
        expect(view.rowSet.size).toBe(1247)

        view = new InMemoryView(_getTestTable(), { columns: _rowset_columns });
        expect(view.rowSet.size).toBe(24)
    })

})

describe('groupBy', () => {
    test('group by single col', () => {

        const view = new InMemoryView(_getInstrumentTable(), { columns });
        let { rows, size } = view.setRange({ lo: 0, hi: 17 });
        // onsole.log(`${join(rows)}`);

        ({ rows, size } = view.groupBy([['Sector', 'asc']]));

        expect(rows.map(d => d.slice(7, 11))).toEqual([
            [100, -1, 27, 'Basic Industries'],
            [101, -1, 79, 'Capital Goods'],
            [102, -1, 35, 'Consumer Durables'],
            [103, -1, 40, 'Consumer Non-Durables'],
            [104, -1, 167, 'Consumer Services'],
            [105, -1, 29, 'Energy'],
            [106, -1, 142, 'Finance'],
            [107, -1, 324, 'Health Care'],
            [108, -1, 50, 'Miscellaneous'],
            [109, -1, 24, 'Public Utilities'],
            [110, -1, 303, 'Technology'],
            [111, -1, 27, 'Transportation']
        ]);

    });
});

describe('updateRow', () => {
    const table = _getTestTable();
    test('update data, no grouping', () => {

        const view = new InMemoryView(table, { columns: _rowset_columns });
        view.setRange({ lo: 0, hi: 10 });
        table.update(4, 4, 9.5, 5, 50);
        const { updates } = view.updates;

        expect(updates.length).toBe(1);
        expect(updates[0]).toEqual({ type: 'update', updates: [[104, 4, 9, 9.5, 5, 100, 50]] })

    });
});

describe('insertRow', () => {
    const table = _getTestTable();
    test('insert into single col grouping, all groups collapsed. Group count update, via updateQueue', () => {
        const view = new InMemoryView(table, { columns: _rowset_columns });
        let { rows, size } = view.setRange({ lo: 0, hi: 10 });
        expect(size).toBe(24);
        ({ rows, size } = view.groupBy([['Group 1', 'asc']]));
        // onsole.log(`${join(rows)}`)
        expect(size).toBe(3);
        expect(rows.map(d => d.slice(6, 10))).toEqual([
            [100, -1, 8, 'G1'],
            [101, -1, 8, 'G2'],
            [102, -1, 8, 'G3']
        ]);

        table.insert(['key25', 'G3', 'O2', 'T3', 5, 100]);
        const { updates } = view.updates;
        expect(updates.length).toBe(1);
        expect(updates[0]).toEqual({
            type: 'update',
            updates: [[102, view.rowSet.meta.COUNT, 9]]
        });

    });

    test('insert into single col grouping, groups expanded. Group count update, via updateQueue', () => {
        const table = _getTestTable();
        const view = new InMemoryView(table, { columns: _rowset_columns });
        let { size } = view.setRange({ lo: 0, hi: 10 });
        expect(size).toBe(24);
        ({ size } = view.groupBy([['Group 1', 'asc']]));
        // onsole.log(`${join(rows)}`);
        view.setGroupState({ 'G1': true });
        view.setGroupState({ 'G1': true, 'G2': true });
        view.setGroupState({ 'G1': true, 'G2': true, 'G3': true });

        table.insert(['key25', 'G1', 'O2', 'T3', 5, 100]);
        const { updates } = view.updates;
        expect(updates.length).toBe(1);
        expect(updates[0].type).toBe('rowset');
        expect(updates[0].size).toBe(28);
        expect(updates[0].rows.map(d => d.slice(6, 10))).toEqual([
            [100, +1, 9, 'G1'],
            [101, 0, 0, 'key01'],
            [102, 0, 0, 'key02'],
            [103, 0, 0, 'key03'],
            [104, 0, 0, 'key04'],
            [105, 0, 0, 'key05'],
            [106, 0, 0, 'key06'],
            [107, 0, 0, 'key07'],
            [108, 0, 0, 'key08'],
            [109, 0, 0, 'key25']
        ]);
    });
});

describe('getFilterData', () => {

    const addCounts = groups => groups.map(group => group[9]).reduce((a, b) => a + b)

    test('no groupBy, no filters, getFilterData', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        let results = view.getFilterData({ name: 'IPO' });
        expect(results).toEqual({
            rows: [],
            range: { lo: 0, hi: 0 },
            size: 38,
            offset: 0,
            selectedIndices: []
        })

        results = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA);
        expect(results).toEqual({
            rows: [
                ['1972', 4, 4, 0, 0, 0, '1972'],
                ['1973', 1, 1, 1, 0, 0, '1973'],
                ['1980', 2, 2, 2, 0, 0, '1980'],
                ['1981', 7, 7, 3, 0, 0, '1981'],
                ['1982', 4, 4, 4, 0, 0, '1982'],
                ['1983', 13, 13, 5, 0, 0, '1983'],
                ['1984', 7, 7, 6, 0, 0, '1984'],
                ['1985', 6, 6, 7, 0, 0, '1985'],
                ['1986', 24, 24, 8, 0, 0, '1986'],
                ['1987', 14, 14, 9, 0, 0, '1987']
            ],
            range: { lo: 0, hi: 10 },
            size: 38,
            offset: 0,
            selectedIndices: []
        })
    });

    test('no groupBy, filter on same column, getFilterData', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.filter({type: SET, colName: 'Sector', values:['Basic Industries']});
        let {size,selectedIndices} = view.getFilterData({ name: 'Sector' });
        expect(size).toEqual(12)
        expect(selectedIndices).toEqual([0]);
    });

    test('no groupBy, getFilterData, with search', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 10 });
        let results = view.getFilterData({ name: 'IPO' });
        results = view.getFilterData({ name: 'IPO' }, '198');
        expect(results).toEqual({
            rows: [],
            range: { lo: 0, hi: 0 },
            size: 10,
            offset: 0,
            selectedIndices: []
        })

        results = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA);
        expect(results).toEqual({
            rows: [
                ['1980', 2, 2, 0, 0, 0, '1980'],
                ['1981', 7, 7, 1, 0, 0, '1981'],
                ['1982', 4, 4, 2, 0, 0, '1982'],
                ['1983', 13, 13, 3, 0, 0, '1983'],
                ['1984', 7, 7, 4, 0, 0, '1984'],
                ['1985', 6, 6, 5, 0, 0, '1985'],
                ['1986', 24, 24, 6, 0, 0, '1986'],
                ['1987', 14, 14, 7, 0, 0, '1987'],
                ['1988', 4, 4, 8, 0, 0, '1988'],
                ['1989', 10, 10, 9, 0, 0, '1989']
            ],
            range: { lo: 0, hi: 10 },
            size: 10,
            offset: 0,
            selectedIndices: []
        })
    });

    test('no groupBy, getFilterData, with search, then repeat with another column', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 10 });
        let results = view.getFilterData({ name: 'IPO' });
        results = view.getFilterData({ name: 'IPO' }, '198');
        results = view.getFilterData({ name: 'Sector' });
        results = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA);

        expect(results).toEqual({
            rows:
                [['Basic Industries', 27, 27, 0, 0, 0, 'Basic Industries'],
                ['Capital Goods', 79, 79, 1, 0, 0, 'Capital Goods'],
                ['Consumer Durables', 35, 35, 2, 0, 0, 'Consumer Durables'],
                ['Consumer Non-Durables', 40, 40, 3, 0, 0, 'Consumer Non-Durables'],
                ['Consumer Services', 167, 167, 4, 0, 0, 'Consumer Services'],
                ['Energy', 29, 29, 5, 0, 0, 'Energy'],
                ['Finance', 142, 142, 6, 0, 0, 'Finance'],
                ['Health Care', 324, 324, 7, 0, 0, 'Health Care'],
                ['Miscellaneous', 50, 50, 8, 0, 0, 'Miscellaneous'],
                ['Public Utilities', 24, 24, 9, 0, 0, 'Public Utilities']],
            range: { lo: 0, hi: 10 },
            size: 12,
            offset: 0,
            selectedIndices: []
        })

    });

    test('when filter is cleared on col1, distinct values on cols are refreshed', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });

        view.filter({type: SET, colName: 'Sector', values: ['Basic Industries']});
        view.setRange({lo: 0,hi: 30}, false);

        view.getFilterData({ name: 'Industry' });
        let {size, rows} = view.setRange({ lo: 0, hi: 3 }, true, DataTypes.FILTER_DATA);
        expect(size).toEqual(109);
        expect(rows).toEqual([
            ['Advertising',0, 10, 0,0,0,'Advertising'],
            ['Aerospace',0, 3, 1,0,0,'Aerospace'],
            ['Agricultural Chemicals',2, 2, 2,0,0,'Agricultural Chemicals']
        ])

        view.filter(null);
        view.getFilterData({ name: 'Industry' });

        ({size, rows} = view.setRange({ lo: 0, hi: 3 }, true, DataTypes.FILTER_DATA));
        expect(size).toEqual(109);
        expect(rows).toEqual([
            ['Advertising',10, 10, 0,0,0,'Advertising'],
            ['Aerospace',3, 3, 1,0,0,'Aerospace'],
            ['Agricultural Chemicals', 2, 2, 2,0,0,'Agricultural Chemicals'],
        ])
    
    })


    test('groupedRowset, single col grouping, apply filter to col then re-request filter data', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.groupBy([['Sector', 'asc']]);
        let results = view.getFilterData({ name: 'Industry' });
        results = view.setRange({ lo: 0, hi: 9 }, true, DataTypes.FILTER_DATA);
        expect(results.rows).toEqual([
            ['Advertising', 10, 10, 0, 0, 0, 'Advertising'],
            ['Aerospace', 3, 3, 1, 0, 0, 'Aerospace'],
            ['Agricultural Chemicals', 2, 2, 2, 0, 0, 'Agricultural Chemicals'],
            ['Air Freight/Delivery Services', 7, 7, 3, 0, 0, 'Air Freight/Delivery Services'],
            ['Aluminum', 1, 1, 4, 0, 0, 'Aluminum'],
            ['Apparel', 9, 9, 5, 0, 0, 'Apparel'],
            ['Auto Manufacturing', 1, 1, 6, 0, 0, 'Auto Manufacturing'],
            ['Auto Parts:O.E.M.', 1, 1, 7, 0, 0, 'Auto Parts:O.E.M.'],
            ['Automotive Aftermarket', 5, 5, 8, 0, 0, 'Automotive Aftermarket']
        ])

        const values = [];
        let { size } = view.filter({ type: SET, colName: 'Industry', values })
        expect(size).toEqual(0);

        values.push('Advertising')
        let { rows } = view.filter({ type: SET, colName: 'Industry', values });
        expect(addCounts(rows)).toBe(10)

        values.push('Apparel');
        ({ rows } = view.filter({ type: SET, colName: 'Industry', values }));
        expect(addCounts(rows)).toBe(19);

        values.push('Auto Manufacturing');
        ({ rows } = view.filter({ type: SET, colName: 'Industry', values }));
        expect(addCounts(rows)).toBe(20);

        values.push('Automotive Aftermarket');
        ({ rows } = view.filter({ type: SET, colName: 'Industry', values }));
        expect(addCounts(rows)).toBe(25);

        results = view.getFilterData({ name: 'Industry' });
        results = view.setRange({ lo: 0, hi: 9 }, true, DataTypes.FILTER_DATA);

        expect(results.selectedIndices).toEqual([0, 5, 6, 8])

    });

    test('groupedRowset, single col grouping, apply filter to col, request filter adta for another col  then re-request filter data', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.groupBy([['Sector', 'asc']]);
        let results = view.getFilterData({ name: 'Industry' });
        results = view.setRange({ lo: 0, hi: 9 }, true, DataTypes.FILTER_DATA);

        let { size } = view.filter({ type: SET, colName: 'Industry', values: [] })
        expect(size).toEqual(0);

        let { rows } = view.filter({
            type: SET, colName: 'Industry', values:
                ['Advertising', 'Apparel', 'Auto Manufacturing', 'Automotive Aftermarket']
        });
        expect(addCounts(rows)).toBe(25)

        results = view.getFilterData({ name: 'IPO' });
        results = view.setRange({ lo: 0, hi: 9 }, true, DataTypes.FILTER_DATA);

        results = view.getFilterData({ name: 'Industry' });
        results = view.setRange({ lo: 0, hi: 9 }, true, DataTypes.FILTER_DATA);
        expect(results.selectedIndices).toEqual([0, 5, 6, 8])

    });
});

describe('getFilterData + Search', () => {
    test('initial search, on filtered column, extend search text', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.getFilterData({ name: 'Name' });
        view.filter({ type: SET, colName: 'Name', values: ['Google Inc.'] });
        view.getFilterData({ name: 'Name' }, 'Go');
        let { rows, selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA);

        expect(selectedIndices).toEqual([3]);

        expect(rows).toEqual([
            ['GoPro, Inc.', 1, 1, 0, 0, 0, 'GoPro, Inc.'],
            ['Gogo Inc.', 1, 1, 1, 0, 0, 'Gogo Inc.'],
            ['Golar LNG Partners LP', 1, 1, 2, 0, 0, 'Golar LNG Partners LP'],
            ['Google Inc.', 1, 1, 3, 0, 0, 'Google Inc.'],
            ['Gordmans Stores, Inc.', 1, 1, 4, 0, 0, 'Gordmans Stores, Inc.']
        ]);

        view.getFilterData({ name: 'Name' }, 'Goo');
        ({ rows } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
        expect(rows).toEqual([
            ['Google Inc.', 1, 1, 0, 0, 0, 'Google Inc.']
        ]);

    });

    test('change search text entirely', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.getFilterData({ name: 'Name' });
        view.filter({ type: SET, colName: 'Name', values: ['Google Inc.'] });
        view.getFilterData({ name: 'Name' }, 'Goo');

        view.getFilterData({ name: 'Name' }, 'F');
        let { selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA);

        view.filter({ type: SET, colName: 'Name', values: ['Google Inc.', 'Facebook, Inc.'] });

        view.getFilterData({ name: 'Name' }, 'Fa');
        ({ selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([1]);

        view.getFilterData({ name: 'Name' }, 'F');
        ({ selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([5]);

    });

    test('clear search', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.getFilterData({ name: 'Name' });
        view.filter({ type: SET, colName: 'Name', values: ['Google Inc.'] });
        view.getFilterData({ name: 'Name' }, 'F');
        let { size, selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA);
        expect(size).toBe(46);
        view.getFilterData({ name: 'Name' });
        ({ size, selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
        expect(size).toBe(1241);
        expect(selectedIndices).toEqual([492]);

    })
});

describe('combined features', () => {
    test('groupedRowset, single col grouping, filter, then expand groups', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.groupBy([['Sector', 'asc']]);
        view.filter({
            type: SET, colName: 'Industry', values:
                ['Advertising', 'Automotive Aftermarket']
        });
        let results = view.setGroupState({ 'Consumer Durables': true });
        expect(results.size).toBe(7);
    });

    test('add then remove groupBy', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.groupBy([['Sector', 'asc']]);
        let { size } = view.groupBy(null);
        expect(size).toBe(1247);

    });

    test('groupedRowset, group by col 1, filter on col2 then add col2 to group', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.groupBy([['Sector', 'asc']]);
        view.filter({
            type: SET, colName: 'Industry', values:
                ['Advertising', 'Apparel', 'Auto Manufacturing', 'Automotive Aftermarket']
        });
        let { rows, size } = view.groupBy([['Sector', 'asc'], ['Industry', 'asc']]);
        expect(size).toBe(5);
        const N = null;

        expect(rows.map(row => row.slice(0, 11))).toEqual([
            [N, N, 203.77, 25550000000, N, 'Capital Goods', N, 100, -2, 1, 'Capital Goods'],
            [N, N, 43.997499999999995, 9418980000, N, 'Consumer Durables', N, 101, -2, 4, 'Consumer Durables'],
            [N, N, 39.92777777777778, 25881370000, N, 'Consumer Non-Durables', N, 102, -2, 9, 'Consumer Non-Durables'],
            [N, N, 20.21, 4078390000, N, 'Consumer Services', N, 103, -2, 5, 'Consumer Services'],
            [N, N, 18.318333333333335, 9415730000, N, 'Technology', N, 104, -2, 6, 'Technology']
        ]);

        ({ rows, size } = view.setGroupState({ 'Capital Goods': true }));
        expect(size).toBe(6);

        expect(rows.map(row => row.slice(0, 11))).toEqual([
            [N, N, 203.77, 25550000000, N, 'Capital Goods', N, 100, +2, 1, 'Capital Goods'],
            [N, N, 203.77, 25550000000, N, 'Capital Goods', 'Auto Manufacturing', 101, -1, 1, 'Capital Goods/Auto Manufacturing',],
            [N, N, 43.997499999999995, 9418980000, N, 'Consumer Durables', N, 102, -2, 4, 'Consumer Durables'],
            [N, N, 39.92777777777778, 25881370000, N, 'Consumer Non-Durables', N, 103, -2, 9, 'Consumer Non-Durables',],
            [N, N, 20.21, 4078390000, N, 'Consumer Services', N, 104, -2, 5, 'Consumer Services',],
            [N, N, 18.318333333333335, 9415730000, N, 'Technology', N, 105, -2, 6, 'Technology',]
        ]);

        ({ rows, size } = view.setGroupState({ 'Capital Goods': false }));
        expect(size).toBe(5);

    });

    test('group by filtered IPO, getDistinctValues for Industry', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.filter({ type: SET, colName: 'IPO', values: [2007, 2010, 2011, 2012, 2013, 2014] });

        let { size, rows } = view.groupBy([['IPO', 'asc']]);
        expect(size).toBe(6);

        view.getFilterData({ name: 'Industry' });
        ({size, rows} = view.setRange({ lo: 0, hi: 200 }, true, DataTypes.FILTER_DATA));
        const industryValues = rows.reduce((a,b) => a + (b[1] ? 1 : 0), 0);
        expect(industryValues).toBe(82);
        expect(size).toBe(109);

    });

    test('getFilteredData for Name, apply filter, then getFilteredData for Sector', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        let { size } = view.getFilterData({ name: 'Name' });
        expect(size).toBe(1241);
        view.filter({ type: SET, colName: 'Name', values: ['ABAXIS, Inc.', 'Apple Inc.'] });
        view.getFilterData({ name: 'Sector' });
        ({ size } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
    });

    test('selectedIndices is maintained as INCLUDE filter is built up', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.getFilterData({ name: 'IPO' });
        let { selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA);
        expect(selectedIndices).toEqual([]);

        view.filter({ type: SET, colName: 'IPO', values: [1973] });

        ({ selectedIndices } = view.setRange({ lo: 10, hi: 20 }, true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([1]);

        ({ selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([1]);

        view.getFilterData({ name: 'IPO' });
        ({ selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([1]);

    });

    test('group by filtered col, remove grouping, filter should still be in place', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        let { size } = view.filter({ type: SET, colName: 'Sector', values: ['Consumer Services', 'Finance', 'Health Care'] });
        ({ size } = view.groupBy([['Sector', 'asc']]));
        expect(size).toBe(3);
        ({ size } = view.groupBy(null));
        expect(size).toBe(633);
    });

    test('expand top-level group, scroll away from top ansd remove lower-level group', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        let { size, rows } = view.groupBy([['Sector', 'asc'], ['Industry', 'asc']]);
        ({ rows, size } = view.setGroupState({ 'Consumer Services': true }));
        expect(size).toBe(42);
        ({ rows, size } = view.setRange({ lo: 17, hi: 34 }));

        ({ size, rows } = view.groupBy([['Sector', 'asc']]));
        expect(size).toBe(179);
        expect(rows.map(row => row.slice(7, 11))).toEqual([
            [117, 0, 0, 'NXST'],
            [118, 0, 0, 'ROIA'],
            [119, 0, 0, 'SALM'],
            [120, 0, 0, 'SBGI'],
            [121, 0, 0, 'SBSA'],
            [122, 0, 0, 'AMZN'],
            [123, 0, 0, 'CDW'],
            [124, 0, 0, 'CNV'],
            [125, 0, 0, 'NSIT'],
            [126, 0, 0, 'OSTK'],
            [127, 0, 0, 'PCCC'],
            [128, 0, 0, 'ZU'],
            [129, 0, 0, 'PLCE'],
            [130, 0, 0, 'CTRN'],
            [131, 0, 0, 'FRAN'],
            [132, 0, 0, 'GMAN'],
            [133, 0, 0, 'PSUN']
        ])

    });

});

// select removed replaced with STARTS_WITH filtering
describe.only('filter', () => {
    test('exclude starts_with, no existing filter', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });

        view.getFilterData({ name: 'Name' });
        view.getFilterData({ name: 'Name' }, 'ab');
        let { size } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA);

        view.filter({type: STARTS_WITH, mode: EXCLUDE, colName: 'Name', value: 'ab'});
        ({ size } = view.setRange({ lo: 0, hi: 10 }, true));

        expect(size).toBe(1244);
        expect(view.filterRowSet.selectedIndices).toEqual([0, 1, 2]);
        // view.getFilterData({ name: 'Name' });
        // ({ size, selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
        // expect(size).toBe(1241)
        // expect(selectedIndices).toEqual([7, 23, 24])

    });

    test('include starts_with, no existing filter', () => {
        const view = new InMemoryView(_getInstrumentTable(), { columns });
        view.setRange({ lo: 0, hi: 17 });
        view.getFilterData({ name: 'Name' });
        let { size, selectedIndices } = view.filter({ type: SET, colName: 'Name', values: [] });
        expect(size).toBe(0);
        view.getFilterData({ name: 'Name' }, 'ab');
        ({ size, selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
        
        ({ size } = view.filter({type: STARTS_WITH, colName: 'Name', value: 'ab'}));
        
        expect(size).toBe(3);
        // expect(view.filterRowSet.selectedIndices).toEqual([0, 1, 2]);
        // view.getFilterData({ name: 'Name' });
        // ({ size, selectedIndices } = view.setRange({ lo: 0, hi: 10 }, true, DataTypes.FILTER_DATA));
        // expect(size).toBe(1241)
        // expect(selectedIndices).toEqual([7, 23, 24])

    });
})
