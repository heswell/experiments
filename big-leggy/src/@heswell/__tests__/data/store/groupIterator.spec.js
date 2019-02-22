import GroupRowSet from '../../../data/store/groupRowSet';
import { 
  _getTestRowset,
  _getInstrumentRowset,
  _rowset_columns,
  _rowset_columns_with_aggregation,
  GROUP_COL_1,
  GROUP_COL_2,
  GROUP_COL_3,
  join
} from '../testData';

function toTuple(val,i){
  if (i % 3 === 0){
    return `\t${val}`
  } else {
    return val;
  }
}

describe('groupIterator', () => {

  test('', () => {
    const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
    const {iter} = rowSet;
    rowSet.setGroupState({'G1': true})

    const [rows, startIdx] = iter.setRange({lo:0,hi:10});
    console.log(join(rows))
    console.log(`startIdx = ${startIdx}`)
    console.log(iter.rangePositions)

  })

  describe('getRangeIndexOfRow', () => {

    test('all groups expanded', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G1': true, 'G2': true, 'G3': true})
      iter.setRange({lo:0, hi: 30})
        
      expect(iter.getRangeIndexOfRow(0,3)).toEqual(4)
      expect(iter.getRangeIndexOfRow(0,6)).toEqual(7)
      expect(iter.getRangeIndexOfRow(1,2)).toEqual(12)
      expect(iter.getRangeIndexOfRow(2,5)).toEqual(24)

    })

    test('first and last groups expanded', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G1': true, 'G3': true})
      iter.setRange({lo:0, hi: 30})
        
      expect(iter.getRangeIndexOfRow(0,3)).toEqual(4)
      expect(iter.getRangeIndexOfRow(0,6)).toEqual(7)
      expect(iter.getRangeIndexOfRow(2,5)).toEqual(16)

    })

    test.only('rowIdx out of range', () => {
      const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
      const {iter} = rowSet;
      rowSet.setGroupState({'G1': true, 'G3': true})
      iter.setRange({lo:0, hi: 30})
      console.log(iter.rangePositions.map(toTuple).join())
 debugger;       
      expect(iter.getRangeIndexOfRow(0,7)).toEqual(8)

    })

  })


})