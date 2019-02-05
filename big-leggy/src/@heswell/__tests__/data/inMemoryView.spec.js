/*global describe test expect */
import InMemoryView from '../../data/store/InMemoryView';
import {DataTypes} from '../../data/store/types'
import {INCLUDE, INCLUDE_SEARCH, EXCLUDE_SEARCH} from '../../data/store/filter'

import { _getTestTable, _rowset_columns, _getInstrumentTable , InstrumentColumns as columns} from './testData'

describe('construction', () => {
    test('construction', () => {
        let view = new InMemoryView(_getInstrumentTable(),{columns});
        expect(view.rowSet.size).toBe(1247)

        view = new InMemoryView(_getTestTable(),{columns: _rowset_columns});
        expect(view.rowSet.size).toBe(24)
    })

})

describe('groupBy', () => {
    test('group by single col', () => {

        const view = new InMemoryView(_getInstrumentTable(),{columns});
        let {rows, size} = view.setRange({lo: 0,hi: 17});
        // console.log(`${join(rows)}`);

        ({rows,size} = view.groupBy([['Sector', 'asc']]));

        expect(rows.map(d => d.slice(0, 4))).toEqual([
            [100,-1,27,'Basic Industries'],
            [101,-1,79,'Capital Goods'],
            [102,-1,35,'Consumer Durables'],
            [103,-1,40,'Consumer Non-Durables'],
            [104,-1,167,'Consumer Services'],
            [105,-1,29,'Energy'],
            [106,-1,142,'Finance'],
            [107,-1,324,'Health Care'],
            [108,-1,50,'Miscellaneous'],
            [109,-1,24,'Public Utilities'],
            [110,-1,303,'Technology'],
            [111,-1,27,'Transportation']
        ]);

    });
});

describe('updateRow', () => {
    const table = _getTestTable();
    test('update data, no grouping', () => {

        const view = new InMemoryView(table,{columns: _rowset_columns});
        view.setRange({lo: 0, hi: 10});

        table.update(4, 4, 9.5, 5, 50);
        const {updates} = view.updates;

        expect(updates.length).toBe(1);
        expect(updates[0]).toEqual({ type: 'update', updates: [ [ 104, 6, 9, 9.5, 7, 100, 50 ] ] })

    });
});

describe('insertRow', () => {
    const table = _getTestTable();
    test('insert into single col grouping, all groups collapsed. Group count update, via updateQueue', () => {
        const view = new InMemoryView(table,{columns: _rowset_columns});
        let {rows, size} = view.setRange({lo: 0, hi: 10});
        expect(size).toBe(24);
        ({rows, size} = view.groupBy([['Group 1', 'asc']]));
        // console.log(`${join(rows)}`)
        expect(size).toBe(3);
        expect(rows.map(d => d.slice(0, 4))).toEqual([
            [100,-1,8,'G1'],
            [101,-1,8,'G2'],
            [102,-1,8,'G3']
        ]);

        table.insert(['key25', 'G3', 'O2', 'T3', 5, 100]);
        const {updates} = view.updates;
        expect(updates.length).toBe(1);
        expect(updates[0]).toEqual({
            type: 'update',
            updates: [[102,-2,9]]
        });

    });

    test('insert into single col grouping, groups expanded. Group count update, via updateQueue', () => {
        const table = _getTestTable();
        const view = new InMemoryView(table,{columns: _rowset_columns});
        let {size} = view.setRange({lo: 0, hi: 10});
        expect(size).toBe(24);
        ({size} = view.groupBy([['Group 1', 'asc']]));
        // console.log(`${join(rows)}`);
        view.setGroupState({'G1': true});
        view.setGroupState({'G1': true, 'G2': true});
        view.setGroupState({'G1': true, 'G2': true, 'G3': true});

        table.insert(['key25', 'G1', 'O2', 'T3', 5, 100]);
        const {updates} = view.updates;
        expect(updates.length).toBe(1);
        expect(updates[0].type).toBe('rowset');
        expect(updates[0].size).toBe(28);
        expect(updates[0].rows.map(d => d.slice(0, 4))).toEqual([
            [100,+1,9,'G1'],
            [101, 0,0,'key01'],
            [102, 0,0,'key02'],
            [103, 0,0,'key03'],
            [104, 0,0,'key04'],
            [105, 0,0,'key05'],
            [106, 0,0,'key06'],
            [107, 0,0,'key07'],
            [108, 0,0,'key08'],
            [109, 0,0,'key25']
        ]);
    });
});

describe('getFilterData', () => {

    const addCounts = groups => groups.map(group => group[2]).reduce((a,b) => a+b)

    test('groupedRowset, single col grouping', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.groupBy([['Sector', 'asc']]);
        let results = view.getFilterData({name: 'IPO'});
        expect(results).toEqual({
            rows: [],
            range: {lo: 0, hi: 0},
            size: 38,
            offset: 0,
            selectedIndices: []
        })
        results = view.setRange({lo: 0, hi: 10}, true, DataTypes.FILTER_DATA);
        expect(results.rows).toEqual([
            [0,0,0,'1972','1972',4],
            [1,0,0,'1973','1973',1],
            [2,0,0,'1980','1980',2],
            [3,0,0,'1981','1981',7],
            [4,0,0,'1982','1982',4],
            [5,0,0,'1983','1983',13],
            [6,0,0,'1984','1984',7],
            [7,0,0,'1985','1985',6],
            [8,0,0,'1986','1986',24],
            [9,0,0,'1987','1987',14]
        ])
    });

    test('groupedRowset, single col grouping, apply filter to col then re-request filter data', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.groupBy([['Sector', 'asc']]);
        let results = view.getFilterData({name: 'Industry'});
        results = view.setRange({lo: 0, hi: 9}, true, DataTypes.FILTER_DATA);
        expect(results.rows).toEqual([
            [0,0,0,'Advertising','Advertising',10],
            [1,0,0,'Aerospace','Aerospace',3],
            [2,0,0,'Agricultural Chemicals','Agricultural Chemicals',2],
            [3,0,0,'Air Freight/Delivery Services','Air Freight/Delivery Services',7],
            [4,0,0,'Aluminum','Aluminum',1],
            [5,0,0,'Apparel','Apparel',9],
            [6,0,0,'Auto Manufacturing','Auto Manufacturing',1],
            [7,0,0,'Auto Parts:O.E.M.','Auto Parts:O.E.M.',1],
            [8,0,0,'Automotive Aftermarket','Automotive Aftermarket',5]
        ])

        const values = [];
        let {size} = view.filter({type: INCLUDE, colName: 'Industry', values})
        expect(size).toEqual(0);

        values.push('Advertising')
        let {rows} = view.filter({type: INCLUDE, colName: 'Industry', values});
        expect(addCounts(rows)).toBe(10)

        values.push('Apparel');
        ({rows} = view.filter({type: INCLUDE, colName: 'Industry', values}));
        expect(addCounts(rows)).toBe(19);

        values.push('Auto Manufacturing');
        ({rows} = view.filter({type: INCLUDE, colName: 'Industry', values}));
        expect(addCounts(rows)).toBe(20);

        values.push('Automotive Aftermarket');
        ({rows} = view.filter({type: INCLUDE, colName: 'Industry', values}));
        expect(addCounts(rows)).toBe(25);

        results = view.getFilterData({name: 'Industry'});
        results = view.setRange({lo: 0, hi: 9}, true, DataTypes.FILTER_DATA);

        expect(results.selectedIndices).toEqual([0,5,6,8])

    });

    test('groupedRowset, single col grouping, apply filter to col, request fulter adta for another col  then re-request filter data', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.groupBy([['Sector', 'asc']]);
        let results = view.getFilterData({name: 'Industry'});
        results = view.setRange({lo: 0, hi: 9}, true, DataTypes.FILTER_DATA);

        let {size} = view.filter({type: INCLUDE, colName: 'Industry', values: []})
        expect(size).toEqual(0);

        let {rows} = view.filter({type: INCLUDE, colName: 'Industry', values:
            ['Advertising','Apparel','Auto Manufacturing','Automotive Aftermarket']});
        expect(addCounts(rows)).toBe(25)

        results = view.getFilterData({name: 'IPO'});
        results = view.setRange({lo: 0, hi: 9}, true, DataTypes.FILTER_DATA);

        results = view.getFilterData({name: 'Industry'});
        results = view.setRange({lo: 0, hi: 9}, true, DataTypes.FILTER_DATA);
        expect(results.selectedIndices).toEqual([0,5,6,8])

    });
});

describe('getFilterData + Search', () => {
    test('initial search, on filtered column, extend search text', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.getFilterData({name: 'Name'});
        view.filter({type: INCLUDE, colName: 'Name', values: ['Google Inc.']});

        view.getFilterData({name: 'Name'}, 'Go');
        let {rows, selectedIndices} = view.setRange({lo: 0, hi: 10},true, DataTypes.FILTER_DATA);

        expect(selectedIndices).toEqual([3]);

        expect(rows).toEqual([
            [0,0,0,'GoPro, Inc.','GoPro, Inc.',1],
            [1,0,0,'Gogo Inc.','Gogo Inc.',1],
            [2,0,0,'Golar LNG Partners LP','Golar LNG Partners LP',1],
            [3,0,0,'Google Inc.','Google Inc.',1],
            [4,0,0,'Gordmans Stores, Inc.','Gordmans Stores, Inc.',1]
        ]);

        view.getFilterData({name: 'Name'}, 'Goo');
        ({rows} = view.setRange({lo: 0, hi: 10},true, DataTypes.FILTER_DATA));
        expect(rows).toEqual([
            [0,0,0,'Google Inc.','Google Inc.',1]
        ]);

    });

    test('change search text entirely', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.getFilterData({name: 'Name'});
        view.filter({type: INCLUDE, colName: 'Name', values: ['Google Inc.']});
        view.getFilterData({name: 'Name'}, 'Goo');

        view.getFilterData({name: 'Name'}, 'F');
        let {selectedIndices} = view.setRange({lo: 0, hi: 10},true, DataTypes.FILTER_DATA);

        view.filter({type: INCLUDE, colName: 'Name', values: ['Google Inc.','Facebook, Inc.']});

        view.getFilterData({name: 'Name'}, 'Fa');
        ({selectedIndices} = view.setRange({lo: 0, hi: 10},true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([1]);

        view.getFilterData({name: 'Name'}, 'F');
        ({selectedIndices} = view.setRange({lo: 0, hi: 10},true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([5]);

    });

    test('clear search', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.getFilterData({name: 'Name'});
        view.filter({type: INCLUDE, colName: 'Name', values: ['Google Inc.']});
        view.getFilterData({name: 'Name'}, 'F');
        let {size,selectedIndices} = view.setRange({lo: 0, hi: 10},true, DataTypes.FILTER_DATA);
        expect(size).toBe(46);
        view.getFilterData({name: 'Name'});
        ({size,selectedIndices} = view.setRange({lo: 0, hi: 10},true, DataTypes.FILTER_DATA));
        expect(size).toBe(1241);
        expect(selectedIndices).toEqual([492]);

    })
});

describe('combined features', () => {
    test('groupedRowset, single col grouping, filter, then expand groups', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.groupBy([['Sector', 'asc']]);
        view.filter({type: INCLUDE, colName: 'Industry', values:
            ['Advertising','Automotive Aftermarket']});
        let results = view.setGroupState({'Consumer Durables': true});
        expect(results.size).toBe(7);
    });

    test('add then remove groupBy', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.groupBy([['Sector', 'asc']]);
        let {size} = view.groupBy(null);
        expect(size).toBe(1247);

    });

    test('groupedRowset, group by col 1, filter on col2 then add col2 to group', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.groupBy([['Sector', 'asc']]);
        view.filter({type: INCLUDE, colName: 'Industry', values:
        ['Advertising','Apparel','Auto Manufacturing','Automotive Aftermarket']});
        let {rows,size} = view.groupBy([['Sector', 'asc'],['Industry','asc']]);
        expect(size).toBe(5);
        const N = null;
        // console.log(`${join(view.rowSet.groupRows.slice(0,15))}`)
        // console.log(`${join(rows)}`)
        // console.log(view.rowSet.filterSet)
        expect(rows.map(row => row.slice(0,11))).toEqual([
            [100,-2,1,'Capital Goods',N,N,203.77,25550000000,N,'Capital Goods',N],
            [101,-2,4,'Consumer Durables',N,N,43.997499999999995,9418980000,N,'Consumer Durables',N],
            [102,-2,9,'Consumer Non-Durables',N,N,39.92777777777778,25881370000,N,'Consumer Non-Durables',N],
            [103,-2,5,'Consumer Services',N,N,20.21,4078390000,N,'Consumer Services',N],
            [104,-2,6,'Technology',N,N,18.318333333333335,9415730000,N,'Technology',N]
        ]);

        ({rows,size} = view.setGroupState({'Capital Goods': true}));
        expect(size).toBe(6);

        expect(rows.map(row => row.slice(0,11))).toEqual([
            [100,+2,1,'Capital Goods',N,N,203.77,25550000000,N,'Capital Goods',N],
            [101,-1,1,'Capital Goods/Auto Manufacturing',N,N,203.77,25550000000,N,'Capital Goods','Auto Manufacturing'],
            [102,-2,4,'Consumer Durables',N,N,43.997499999999995,9418980000,N,'Consumer Durables',N],
            [103,-2,9,'Consumer Non-Durables',N,N,39.92777777777778,25881370000,N,'Consumer Non-Durables',N],
            [104,-2,5,'Consumer Services',N,N,20.21,4078390000,N,'Consumer Services',N],
            [105,-2,6,'Technology',N,N,18.318333333333335,9415730000,N,'Technology',N]
        ]);

        ({rows,size} = view.setGroupState({'Capital Goods': false}));
        expect(size).toBe(5);

    });

    test('group by filtered IPO, getDistinctValues for Industry', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.filter({type: INCLUDE, colName: 'IPO', values: [2007,2010,2011,2012,2013,2014]});

        let {size} = view.groupBy([['IPO','asc']]);
        expect(size).toBe(6);

        ({size} = view.getFilterData({name: 'Industry'}));
        expect(size).toBe(82);

    });

    test('getFilteredData for Name, apply filter, then getFilteredData for Sector', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        let {size} = view.getFilterData({name: 'Name'});
        expect(size).toBe(1241);
        view.filter({type: INCLUDE, colName: 'Name', values: ['ABAXIS, Inc.','Apple Inc.']});
        view.getFilterData({name: 'Sector'});
        ({size} = view.setRange({lo: 0, hi: 10},true, DataTypes.FILTER_DATA));
    });

    test('selectedIndices is maintained as INCLUDE filter is built up', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.getFilterData({name: 'IPO'});
        let {selectedIndices} = view.setRange({lo: 0, hi: 10}, true, DataTypes.FILTER_DATA);
        expect(selectedIndices).toEqual([]);

        view.filter({type: INCLUDE, colName: 'IPO', values: [1973]});

        ({selectedIndices} = view.setRange({lo: 10, hi: 20}, true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([1]);

        ({selectedIndices} = view.setRange({lo: 0, hi: 10}, true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([1]);

        view.getFilterData({name: 'IPO'});
        ({selectedIndices} = view.setRange({lo: 0, hi: 10}, true, DataTypes.FILTER_DATA));
        expect(selectedIndices).toEqual([1]);

    });

    test('group by filtered col, remove grouping, filter should still be in place', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        let {size} = view.filter({type: INCLUDE, colName: 'Sector', values: ['Consumer Services','Finance','Health Care']});
        ({size} = view.groupBy([['Sector','asc']]));
        expect(size).toBe(3);
        ({size} = view.groupBy(null));
        expect(size).toBe(633);
    });

    test('expand top-level group, scroll away from top ansd remove lower-level group', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        let {size, rows} = view.groupBy([['Sector','asc'],['Industry','asc']]);
        ({rows, size} = view.setGroupState({'Consumer Services': true}));
        expect(size).toBe(42);
        ({rows, size} = view.setRange({lo: 17,hi: 34}));

        ({size, rows} = view.groupBy([['Sector','asc']]));
        expect(size).toBe(179);
        expect(rows.map(row => row.slice(0,4))).toEqual([
            [117,0,0,'NXST'],
            [118,0,0,'ROIA'],
            [119,0,0,'SALM'],
            [120,0,0,'SBGI'],
            [121,0,0,'SBSA'],
            [122,0,0,'AMZN'],
            [123,0,0,'CDW'],
            [124,0,0,'CNV'],
            [125,0,0,'NSIT'],
            [126,0,0,'OSTK'],
            [127,0,0,'PCCC'],
            [128,0,0,'ZU'],
            [129,0,0,'PLCE'],
            [130,0,0,'CTRN'],
            [131,0,0,'FRAN'],
            [132,0,0,'GMAN'],
            [133,0,0,'PSUN']
        ])

    });

});

describe('select', () => {
    test('exclude-search-results, no existing filter', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.getFilterData({name: 'Name'});
        view.getFilterData({name: 'Name'}, 'ab');
        let {size, selectedIndices} = view.setRange({lo: 0,hi: 10}, true, DataTypes.FILTER_DATA);
        ({size} = view.select(DataTypes.FILTER_DATA, 'Name', EXCLUDE_SEARCH));
        expect(size).toBe(1244);
        expect(view.filterRowSet.selectedIndices).toEqual([0,1,2]);
        view.getFilterData({name: 'Name'});
        ({size, selectedIndices} = view.setRange({lo: 0,hi: 10}, true, DataTypes.FILTER_DATA));
        expect(size).toBe(1241)
        expect(selectedIndices).toEqual([7,23,24])

    });

    test('include-search-results, no existing filter', () => {
        const view = new InMemoryView(_getInstrumentTable(),{columns});
        view.setRange({lo: 0,hi: 17});
        view.getFilterData({name: 'Name'});
        let {size, selectedIndices} = view.filter({type: INCLUDE, colName: 'Name', values: []});
        expect(size).toBe(0);
        view.getFilterData({name: 'Name'}, 'ab');
        ({size, selectedIndices} = view.setRange({lo: 0,hi: 10}, true, DataTypes.FILTER_DATA));
        ({size} = view.select(DataTypes.FILTER_DATA, 'Name', INCLUDE_SEARCH));
        expect(size).toBe(3);
        expect(view.filterRowSet.selectedIndices).toEqual([0,1,2]);
        view.getFilterData({name: 'Name'});
        ({size, selectedIndices} = view.setRange({lo: 0,hi: 10}, true, DataTypes.FILTER_DATA));
        expect(size).toBe(1241)
        expect(selectedIndices).toEqual([7,23,24])

    });
})
