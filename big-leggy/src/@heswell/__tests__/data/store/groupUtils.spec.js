import {groupLeafRows, groupRows, GroupRow, fillNavSetsFromGroups} from '../../../data/store/groupUtils';
import {buildColumnMap} from '../../../data/store/columnUtils';

import {_data as rows, _table_columns as columns, _getTestTable, join, extract} from '../testData';

const columnMap = buildColumnMap(columns)

describe('groupUtils', () => {

  describe('groupLeafRows', () => {
    test('group leaf rows by single groupby, already in correct sort order', () => {
        const sortSet = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
        const groupBy = [[1,'asc']]
        const result = groupLeafRows(sortSet, rows, groupBy)
        expect(result).toEqual({
            G1: [0,1,2,3,4,5,6,7],
            G2: [8,9,10,11,12,13,14,15],
            G3: [16,17,18,19,20,21,22,23]
        })
    })
  })

  describe('fillNavSetsFromGroups', () => {
    test('fill sortSet from singlr level grouped rows already in right sort order', () => {

      const sortSet = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
      const groupBy = [[1,'asc']]
      const groups= groupLeafRows(sortSet, rows, groupBy)
      fillNavSetsFromGroups(groups, sortSet);
      expect(sortSet).toEqual(sortSet)
    })
  })

  describe('GroupRow', () => {

    test('populates the appropriate metadata attributes', () => {
      const [row] = rows;
      const groupBy = [[0, 'asc']]
      const groupRow = GroupRow(row, 0, 0, 0, 0, groupBy, columns, columnMap)
      expect(groupRow).toEqual(['key01',null,null,null,null,null, 0, -0, 0, 'key01', 0, 0, 0, undefined, undefined])
      
    })

  })

  describe('groupRows', () => {
    test('basic grouping', () => {

      const sortSet = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
      const groupBy = [[1,'asc']]
      const groups= groupRows(rows, sortSet, columns, columnMap, groupBy)
  
      expect(groups).toEqual([
        [null,'G1',null,null,null,null, 0, -1, 8, 'G1', 0, null, 0, undefined, undefined],
        [null,'G2',null,null,null,null, 1, -1, 8, 'G2', 0, null, 8, undefined, undefined ],
        [null,'G3',null,null,null,null, 2, -1, 8, 'G3', 0, null, 16, undefined, undefined]
      ]);

    })

    test('test 27', () => {

      const sortSet = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
      const groupBy = [[1,'asc'],[2, 'asc']]

      const groups= groupRows(rows, sortSet, columns, columnMap, groupBy)

      const nulls = Array(12).fill(null);
      const undef = Array(12).fill(undefined);

      // Grouped Cols
      expect(extract(groups,1)).toEqual(['G1','G1','G1','G2','G2','G2','G2','G3','G3','G3','G3','G3'])
      expect(extract(groups,2)).toEqual([null,'I2','U2',null,'I2','O2','U2',null,'A2','E2','I2','O2'])
      // non-grouped cols
      expect(extract(groups,0)).toEqual(nulls)
      expect(extract(groups,3)).toEqual(nulls)
      expect(extract(groups,4)).toEqual(nulls)
      expect(extract(groups,5)).toEqual(nulls)
      // idx
      expect(extract(groups,6)).toEqual([0,1,2,3,4,5,6,7,8,9,10,11])
      // depth
      expect(extract(groups,7)).toEqual([-2,-1,-1,-2,-1,-1,-1,-2,-1,-1,-1,-1])
      // count
      expect(extract(groups,8)).toEqual([8,4,4,8,2,4,2,8,2,4,1,1])
      // key
      expect(extract(groups,9)).toEqual(['G1','G1/I2','G1/U2','G2','G2/I2','G2/O2','G2/U2','G3','G3/A2','G3/E2','G3/I2','G3/O2'])
      // parent
      expect(extract(groups,11)).toEqual([null,0,0,null,3,3,3,null,7,7,7,7])
      // row pointer (note the child row indices point to the sort set, not the underlying row indices)
      expect(extract(groups,12)).toEqual([1,0,4,4,8,10,14,8,16,18,22,23])
      // filter cols
      expect(extract(groups,13)).toEqual(undef)
      expect(extract(groups,14)).toEqual(undef)


    })

  })
})