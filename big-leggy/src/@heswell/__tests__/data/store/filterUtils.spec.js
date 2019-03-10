import {extractFilterForColumn} from '../../../data/store/filterUtils';
import {AND, GREATER_EQ, LESS_EQ} from '../../../data/store/filter';


describe('filterUtils', () => {

  describe('extractFilterForColumn', () => {
    test('top-level filter is ANDed filters for same column', () => {

      const filter = {type: AND, filters: [
        {type: GREATER_EQ, colName: 'Price', value: 2},
        {type: LESS_EQ, colName: 'Price', value: 5}
      ]}

      expect(extractFilterForColumn(filter, 'Price')).toEqual(filter);


    })
  })


})