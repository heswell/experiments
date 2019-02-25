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
        0,0,null,
        1,1,null,
        2,2,null
      ]);

    })

    test('all groups expanded', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0, 0, null,
        1, 0, 0,
        2, 0, 1,
        3, 0, 2,
        4, 0, 3,
        5, 0, 4,
        6, 0, 5,
        7, 0, 6,
        8, 0, 7,
        9, 1,null,
        10,1,0,
        11,1,1,
        12,1,2,
        13,1,3,
        14,1,4,
        15,1,5,
        16,1,6,
        17,1,7,
        18,2,null,
        19,2,0,
        20,2,1,
        21,2,2,
        22,2,3,
        23,2,4,
        24,2,5,
        25,2,6,
        26,2,7
      ]);

    })

    test('all groups expanded, unequal groups', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_3]);
      rowSet.setGroupState({'T3': true, 'T4': true, 'T5': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0, 0, null, // T3
        1, 0, 0,
        2, 0, 1,
        3, 0, 2,
        4, 0, 3,
        5, 0, 4,
        6, 0, 5,
        7, 0, 6,
        8, 0, 7,
        9, 0, 8,
        10,0, 9,
        11,0, 10,
        12,0, 11,
        13,0, 12,
        14,0, 13,
        15,0, 14,
        16,0, 15,
        17,0, 16,
        18,0, 17,
        19,0, 18,
        20,0, 19,
        21,1, null, // T4
        22,1, 0,  
        23,1, 1,
        24,1, 2,
        25,2, null, // T5
        26,2, 0
      ]);
    })

    test('all groups expanded, unequal groups, limited range', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_3]);
      rowSet.setGroupState({'T3': true, 'T4': true, 'T5': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 10})

      expect(iter.rangePositions).toEqual([
        0, 0, null, // T3
        1, 0, 0,
        2, 0, 1,
        3, 0, 2,
        4, 0, 3,
        5, 0, 4,
        6, 0, 5,
        7, 0, 6,
        8, 0, 7,
        9, 0, 8
      ]);
    })

    test('all groups expanded, unequal groups, limited range, scrolled', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_3]);
      rowSet.setGroupState({'T3': true, 'T4': true, 'T5': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 10})
      iter.setRange({lo:10, hi: 20})

      expect(iter.rangePositions).toEqual([
        10,0, 9,
        11,0, 10,
        12,0, 11,
        13,0, 12,
        14,0, 13,
        15,0, 14,
        16,0, 15,
        17,0, 16,
        18,0, 17,
        19,0, 18
      ]);

      iter.setRange({lo:17, hi: 27});
      expect(iter.rangePositions).toEqual([
        17,0, 16,
        18,0, 17,
        19,0, 18,
        20,0, 19,
        21,1, null, // T4
        22,1, 0,  
        23,1, 1,
        24,1, 2,
        25,2, null, // T5
        26,2, 0
      ]);

    })

    test('all groups collapsed, multi level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1, GROUP_COL_2]);
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0,0,null,
        1,3,null,
        2,7,null
      ]);
    })

    test('all top-level groups expanded, multi level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1, GROUP_COL_2]);
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0,0,null, // G1
        1,1,null,
        2,2,null,
        3,3,null, // G2
        4,4,null,
        5,5,null,
        6,6,null,
        7,7,null, // G3
        8,8,null,
        9,9,null,
        10,10,null,
        11,11,null

      ]);
    })

    test.only('first group fully expanded, multi level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1, GROUP_COL_2]);
      rowSet.setGroupState({'G1': {'I2': true, 'U2': true}})
      const {iter} = rowSet;
      iter.setRange({lo:0, hi: 30})

      expect(iter.rangePositions).toEqual([
        0, 0,null, // G1
        1, 1,null, // G1/I2
        2, 1, 0,
        3, 1, 1,
        4, 1, 2,
        5, 1, 3,
        6, 2, null, // G1/U2
        7, 2, 0,
        8, 2, 1,
        9, 2, 2,
        10,2, 3,
        11,3,null, // G2
        12,7,null, // G3
      ]);
    })

  })

  describe('getRangeIndexOfRow', () => {

    test('all groups expanded, single level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfRow(0,3)).toEqual(4)
      expect(iter.getRangeIndexOfRow(0,6)).toEqual(7)
      expect(iter.getRangeIndexOfRow(1,8)).toEqual(10)
      expect(iter.getRangeIndexOfRow(2,23)).toEqual(26)

    })

    test('middle group expanded, single level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G2': true})
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfRow(1,8)).toEqual(2)
      expect(iter.getRangeIndexOfRow(1,12)).toEqual(6)
      expect(iter.getRangeIndexOfRow(1,15)).toEqual(9)

    })

    test('middle group expanded, single level grouping, get group indices', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G2': true})
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfRow(0)).toEqual(0)
      expect(iter.getRangeIndexOfRow(1)).toEqual(1)
      expect(iter.getRangeIndexOfRow(2)).toEqual(10)
    })

    test('middle group expanded, single level grouping, get group indices, not  all in range', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G2': true})
      iter.setRange({lo:0, hi: 8})

      expect(iter.getRangeIndexOfRow(0)).toEqual(0)
      expect(iter.getRangeIndexOfRow(1)).toEqual(1)
      expect(iter.getRangeIndexOfRow(2)).toEqual(-1)
    })

    test('first and last groups expanded, single level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G1': true, 'G3': true})
      /*const [rows] = */ iter.setRange({lo:0, hi: 30})

      // onsole.log(rowSet.iter.rangePositions.map(toTuple).join())        
      // onsole.log(join(rows))

      expect(iter.getRangeIndexOfRow(0,3)).toEqual(4)
      expect(iter.getRangeIndexOfRow(0,6)).toEqual(7)
      expect(iter.getRangeIndexOfRow(2,17)).toEqual(12)

    })

    test('rowIdx out of range, single level', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G1': true, 'G3': true})
      iter.setRange({lo:0, hi: 6})
      expect(iter.getRangeIndexOfRow(0,7)).toEqual(-1)

    })

    test('middle group expanded, two level grouping', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G2': {'I2': true}})
      iter.setRange({lo:0, hi: 30})

      expect(iter.getRangeIndexOfRow(1,9)).toEqual(3)
      expect(iter.getRangeIndexOfRow(1,10)).toEqual(4)

    })

    test('scroll rowset with expanded group', () => {
      const rowSet = new GroupRowSet(_getInstrumentRowset(), InstrumentColumns, [['Sector', 'asc']]);
      const {iter} = rowSet;

      rowSet.setGroupState({'Basic Industries': true})
      iter.setRange({lo:0, hi: 25})

      iter.setRange({lo:14, hi: 38});

      expect(iter.getRangeIndexOfRow(0)).toEqual(-1)
      expect(iter.getRangeIndexOfRow(0,1131)).toEqual(10)

    })

  })


})