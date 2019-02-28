import GroupRowSet from '../../../data/store/groupRowSet';
import { 
  _getTestRowset,
  _getInstrumentRowset,
  InstrumentColumns,
  _rowset_columns,
  _rowset_columns_with_aggregation,
  GROUP_COL_1,
  GROUP_COL_2,
  GROUP_COL_3,
  toTuple,
  pluck,
  join
} from '../testData';

describe('groupIterator', () => {

  // test('', () => {
  //   const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
  //   rowSet.setGroupState({'G2': true})
  //   const {iter} = rowSet;
  //   const [rows, startIdx] = iter.setRange({lo:0,hi:10});
  //   console.log(rowSet.iter.rangePositions.map(toTuple).join())        
  //   console.log(join(rows))

  //   // const [rows, startIdx] = iter.setRange({lo:0,hi:10});
  //   // console.log(join(rows))
  //   // console.log(`startIdx = ${startIdx}`)
  //   // console.log(iter.rangePositions)

  // })

  describe('rangePositions', () => {
    test('all groups collapsed', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0,0,null,null,
        1,1,null,null,
        2,2,null,null
      ]);

    })

    test('all groups expanded', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0, 0, null, null,
        1, 0, 0, 0,
        2, 0, 1, 1,
        3, 0, 2, 2,
        4, 0, 3, 3,
        5, 0, 4, 4,
        6, 0, 5, 5,
        7, 0, 6, 6,
        8, 0, 7, 7,
        9, 1,null, null,
        10,1,0, 8,
        11,1,1, 9,
        12,1,2, 10,
        13,1,3, 11,
        14,1,4, 12,
        15,1,5, 13,
        16,1,6, 14,
        17,1,7, 15,
        18,2,null, null,
        19,2,0, 16,
        20,2,1, 17,
        21,2,2, 18,
        22,2,3, 19,
        23,2,4, 20,
        24,2,5, 21,
        25,2,6, 22,
        26,2,7, 23
      ]);

    })

    test('all groups expanded, unequal groups', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_3]);
      rowSet.setGroupState({'T3': true, 'T4': true, 'T5': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0, 0, null, null, // T3
        1, 0, 0, 0,
        2, 0, 1, 1,
        3, 0, 2, 4,
        4, 0, 3, 5,
        5, 0, 4, 8,
        6, 0, 5, 9,
        7, 0, 6, 10,
        8, 0, 7, 11,
        9, 0, 8, 12,
        10,0, 9, 13,
        11,0, 10, 14,
        12,0, 11, 15,
        13,0, 12, 16,
        14,0, 13, 17,
        15,0, 14, 18,
        16,0, 15, 19,
        17,0, 16, 20,
        18,0, 17, 21,
        19,0, 18, 22,
        20,0, 19, 23,
        21,1, null, null, // T4
        22,1, 0, 2,
        23,1, 1, 3,
        24,1, 2, 6,
        25,2, null, null,// T5
        26,2, 0, 7
      ]);
    })

    test('all groups expanded, unequal groups, limited range', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_3]);
      rowSet.setGroupState({'T3': true, 'T4': true, 'T5': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 10})

      expect(iter.rangePositions).toEqual([
        0, 0, null, null, // T3
        1, 0, 0, 0,
        2, 0, 1, 1,
        3, 0, 2, 4,
        4, 0, 3, 5,
        5, 0, 4, 8,
        6, 0, 5, 9,
        7, 0, 6, 10,
        8, 0, 7, 11,
        9, 0, 8, 12
      ]);
    })

    test('all groups expanded, unequal groups, limited range, scrolled', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_3]);
      rowSet.setGroupState({'T3': true, 'T4': true, 'T5': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 10})
      iter.setRange({lo:10, hi: 20})

      expect(iter.rangePositions).toEqual([
        10,0, 9, 13,
        11,0, 10, 14,
        12,0, 11, 15,
        13,0, 12, 16,
        14,0, 13, 17,
        15,0, 14, 18,
        16,0, 15, 19,
        17,0, 16, 20,
        18,0, 17, 21,
        19,0, 18, 22
      ]);

      iter.setRange({lo:17, hi: 27});
      expect(iter.rangePositions).toEqual([
        17,0, 16, 20,
        18,0, 17, 21,
        19,0, 18, 22,
        20,0, 19, 23,
        21,1, null, null, // T4
        22,1, 0, 2, 
        23,1, 1, 3,
        24,1, 2, 6,
        25,2, null, null,// T5
        26,2, 0, 7
      ]);

    })

    test('all groups collapsed, multi level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1, GROUP_COL_2]);
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0,0,null, null,
        1,3,null, null,
        2,7,null, null
      ]);
    })

    test('all top-level groups expanded, multi level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1, GROUP_COL_2]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0,0,null,null, // G1
        1,1,null,null,
        2,2,null,null,
        3,3,null,null, // G2
        4,4,null,null,
        5,5,null,null,
        6,6,null,null,
        7,7,null,null, // G3
        8,8,null,null,
        9,9,null,null,
        10,10,null,null,
        11,11,null,null

      ]);
    })

    test('first group fully expanded, multi level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1, GROUP_COL_2]);
      rowSet.setGroupState({'G1': {'I2': true, 'U2': true}})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0, 0, null,null, // G1
        1, 1, null,null, // G1/I2
        2, 1, 0, 4,
        3, 1, 1, 5,
        4, 1, 2, 6,
        5, 1, 3, 7,
        6, 2, null, null, // G1/U2
        7, 2, 0, 0,
        8, 2, 1, 1,
        9, 2, 2, 2,
        10,2, 3, 3,
        11,3, null, null, // G2
        12,7, null, null // G3
      ]);
    })

  })

  describe('getRangeIndexOfGroup', () => {
    test('all groups collapsed, single level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfGroup(0)).toEqual(0)
      expect(iter.getRangeIndexOfGroup(1)).toEqual(1)
      expect(iter.getRangeIndexOfGroup(2)).toEqual(2)
    })

    test('all groups expanded, single level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfGroup(0)).toEqual(0)
      expect(iter.getRangeIndexOfGroup(1)).toEqual(9)
      expect(iter.getRangeIndexOfGroup(2)).toEqual(18)
    })

    test('top-level groups expanded, two level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1, GROUP_COL_2]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfGroup(0)).toEqual(0) // G1
      expect(iter.getRangeIndexOfGroup(1)).toEqual(1) // G1/I2
      expect(iter.getRangeIndexOfGroup(2)).toEqual(2) // G1/U2
    })
  });

  describe('setRange', () => {

    test('gets initial range and subsequent contiguous ranges', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;

      let [rows] = iter.setRange({lo:0, hi: 10})
      expect(pluck(rows,6, 0,1)).toEqual([
        [0, null, 'G1'],     // 0 is grpIdx
        [0, 'key01', 'G1'],  // 0 id rowIdx
        [1, 'key02', 'G1'],
        [2, 'key03', 'G1'],
        [3, 'key04', 'G1'],
        [4, 'key05', 'G1'],
        [5, 'key06', 'G1'],
        [6, 'key07', 'G1'],
        [7, 'key08', 'G1'],
        [1, null, 'G2' ]
      ]);

      [rows] = iter.setRange({lo:10, hi: 20});
      expect(pluck(rows,6, 0,1)).toEqual([ 
      [ 8, 'key09', 'G2' ],
      [ 9, 'key10', 'G2' ],
      [ 10, 'key11', 'G2' ],
      [ 11, 'key12', 'G2' ],
      [ 12, 'key13', 'G2' ],
      [ 13, 'key14', 'G2' ],
      [ 14, 'key15', 'G2' ],
      [ 15, 'key16', 'G2' ],
      [ 2, null, 'G3' ],
      [ 16, 'key17', 'G3' ] ]);

      [rows] = iter.setRange({lo:20, hi: 30});
      expect(pluck(rows,6, 0,1)).toEqual([
        [ 17, 'key18', 'G3' ],
        [ 18, 'key19', 'G3' ],
        [ 19, 'key20', 'G3' ],
        [ 20, 'key21', 'G3' ],
        [ 21, 'key22', 'G3' ],
        [ 22, 'key23', 'G3' ],
        [ 23, 'key24', 'G3' ] ]
      );
    })

    test('gets initial range and subsequent overlapping, same size range, using delta', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;

      let [rows] = iter.setRange({lo:0, hi: 10});
      [rows] = iter.setRange({lo:6, hi: 16});
      expect(pluck(rows,6, 0,1)).toEqual([ 
      [ 8, 'key09', 'G2' ],
      [ 9, 'key10', 'G2' ],
      [ 10, 'key11', 'G2' ],
      [ 11, 'key12', 'G2' ],
      [ 12, 'key13', 'G2' ],
      [ 13, 'key14', 'G2' ]
    ]);
    })

    test('gets initial range and subsequent overlapping, same size range, not delta', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;

      let [rows] = iter.setRange({lo:0, hi: 10});
      [rows] = iter.setRange({lo:6, hi: 16}, false);
      expect(pluck(rows,6, 0,1)).toEqual([ 
      [5, 'key06', 'G1'],
      [6, 'key07', 'G1'],
      [7, 'key08', 'G1'],
      [1, null, 'G2' ],
      [ 8, 'key09', 'G2' ],
      [ 9, 'key10', 'G2' ],
      [ 10, 'key11', 'G2' ],
      [ 11, 'key12', 'G2' ],
      [ 12, 'key13', 'G2' ],
      [ 13, 'key14', 'G2' ]
    ]);
    })

    test('skips rows where next range is not contiguous', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;

      let [rows] = iter.setRange({lo:0, hi: 10});
      [rows] = iter.setRange({lo:20, hi: 30});
      expect(pluck(rows,6, 0,1)).toEqual([
        [ 17, 'key18', 'G3' ],
        [ 18, 'key19', 'G3' ],
        [ 19, 'key20', 'G3' ],
        [ 20, 'key21', 'G3' ],
        [ 21, 'key22', 'G3' ],
        [ 22, 'key23', 'G3' ],
        [ 23, 'key24', 'G3' ] ]
      );
    })

    test('backward navigation', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;
      let [rows] = iter.setRange({lo:0, hi: 10});
      [rows] = iter.setRange({lo:10, hi: 20});
      [rows] = iter.setRange({lo:0, hi: 10});
      expect(pluck(rows,6, 0,1)).toEqual([
        [0, null, 'G1'],     // 0 is grpIdx
        [0, 'key01', 'G1'],  // 0 id rowIdx
        [1, 'key02', 'G1'],
        [2, 'key03', 'G1'],
        [3, 'key04', 'G1'],
        [4, 'key05', 'G1'],
        [5, 'key06', 'G1'],
        [6, 'key07', 'G1'],
        [7, 'key08', 'G1'],
        [1, null, 'G2' ]
      ]);
    })

    test('backward navigation, skipping rows', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;
      let [rows] = iter.setRange({lo:0, hi: 10});
      [rows] = iter.setRange({lo:10, hi: 20});
      [rows] = iter.setRange({lo:20, hi: 30});
      [rows] = iter.setRange({lo:0, hi: 10});

      expect(pluck(rows,6, 0,1)).toEqual([
        [0, null, 'G1'],     // 0 is grpIdx
        [0, 'key01', 'G1'],  // 0 id rowIdx
        [1, 'key02', 'G1'],
        [2, 'key03', 'G1'],
        [3, 'key04', 'G1'],
        [4, 'key05', 'G1'],
        [5, 'key06', 'G1'],
        [6, 'key07', 'G1'],
        [7, 'key08', 'G1'],
        [1, null, 'G2' ]
      ]);


    })

  })

  describe('getCurrentRange', () => {

  })

  describe('getRangeIndexOfRow', () => {

    test('all groups expanded, single level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfRow(3)).toEqual(4)
      expect(iter.getRangeIndexOfRow(6)).toEqual(7)
      expect(iter.getRangeIndexOfRow(8)).toEqual(10)
      expect(iter.getRangeIndexOfRow(23)).toEqual(26)

    })

    test('middle group expanded, single level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G2': true})
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfRow(8)).toEqual(2)
      expect(iter.getRangeIndexOfRow(12)).toEqual(6)
      expect(iter.getRangeIndexOfRow(15)).toEqual(9)

    })

    test('middle group expanded, single level grouping, get group indices', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G2': true})
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfRow(0)).toEqual(-1)
      expect(iter.getRangeIndexOfRow(8)).toEqual(2)
      expect(iter.getRangeIndexOfRow(15)).toEqual(9)
      expect(iter.getRangeIndexOfRow(16)).toEqual(-1)
    })

    test('middle group expanded, single level grouping, get group indices, not  all in range', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G2': true})
      iter.setRange({lo:0, hi: 8})

      expect(iter.getRangeIndexOfRow(0)).toEqual(-1)
      expect(iter.getRangeIndexOfRow(8)).toEqual(2)
      expect(iter.getRangeIndexOfRow(15)).toEqual(-1)
      expect(iter.getRangeIndexOfRow(16)).toEqual(-1)
    })

    test('first and last groups expanded, single level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G1': true, 'G3': true})
      /*const [rows] = */ iter.setRange({lo:0, hi: 30})

      // onsole.log(rowSet.iter.rangePositions.map(toTuple).join())        
      // onsole.log(join(rows))

      expect(iter.getRangeIndexOfRow(3)).toEqual(4)
      expect(iter.getRangeIndexOfRow(6)).toEqual(7)
      expect(iter.getRangeIndexOfRow(17)).toEqual(12)

    })

    test('rowIdx out of range, single level', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G1': true, 'G3': true})
      iter.setRange({lo:0, hi: 6})
      expect(iter.getRangeIndexOfRow(7)).toEqual(-1)

    })

    test('middle group expanded, two level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G2': {'I2': true}})
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfRow(9)).toEqual(3)
      expect(iter.getRangeIndexOfRow(10)).toEqual(4)

    })

    test('scroll rowset with expanded group', () => {
      const rowSet = new GroupRowSet(_getInstrumentRowset(), InstrumentColumns, [['Sector', 'asc']]);
      const {iter} = rowSet;

      rowSet.setGroupState({'Basic Industries': true})
      iter.setRange({lo:0, hi: 25})

      iter.setRange({lo:14, hi: 38});

      expect(iter.getRangeIndexOfRow(0)).toEqual(-1)
      expect(iter.getRangeIndexOfRow(1131)).toEqual(10)

    })

  })


})