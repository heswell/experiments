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

describe('groupIterator', () => {

  test('', () => {
    const rowSet = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
    const {iter} = rowSet;
    rowSet.setGroupState({'G1': true})

    debugger;
    const [rows, startIdx] = iter.setRange({lo:0,hi:10});
    debugger;
    console.log(join(rows))
    console.log(`startIdx = ${startIdx}`)
    console.log(iter.rangePositions)

  })

})