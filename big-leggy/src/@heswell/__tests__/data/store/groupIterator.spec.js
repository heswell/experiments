import GroupRowSet from '../../../data/store/groupRowSet';
import { 
  _getTestRowset,
  _getInstrumentRowset,
  _rowset_columns,
  _rowset_columns_with_aggregation,
  GROUP_COL_1,
  GROUP_COL_2,
  GROUP_COL_3
} from '../testData';

describe('groupIterator', () => {

  test('', () => {
    const {iter} = new GroupRowSet(_getTestRowset(), _rowset_columns, [GROUP_COL_1]);
    console.log(iter.setRange({lo:0,hi:10}))

  })

})