import {RowSet} from './rowSet';
import {SET, STARTS_WITH} from '../filter';
import {extractFilterForColumn} from '../filterUtils';

export class FilterRowSet extends RowSet {
  constructor(table, columns, columnName){
      super(table, columns);
      this.columnName = columnName;
      this._searchText = null;
      this.sort([['value','asc']]);
  }

  get searchText(){
      return this._searchText;
  }

  set searchText(text){
      this.filter({type: 'SW',colName: 'value', value: text});
      this._searchText = text;
  }

  get values() {
      // we don't seem to have a working meta here
      const KEY = 0;
      return this.filterSet.map(idx => this.data[idx][KEY])
  }

  setSelectedIndices(filter){
      const columnFilter = extractFilterForColumn(filter, this.columnName);
      const filterType = columnFilter && columnFilter.type;
      if (filterType === SET){ // what about numeric GE etc
          this.selectedIndices = this.indexOfKeys(columnFilter.values);
      } else if (filter.type === STARTS_WITH){
        console.log(`how do we set selectedIndices for a starts_with filter ? filterSet: ${this.filterSet}`)
        // we need the selectedIndices of just the rows in the viewport
      }
  }

  indexOfKeys(values){
      // Note: filterset is a collection of rowIdx values, nor sortSet idx values 
      const {sortSet, sortCols, filterSet, table} = this;
      const index = table.index;
      return values.map(value => {
          const rowIdx = index[value];
          if (filterSet !== null){
              const filterIdx = filterSet.indexOf(rowIdx);
                return filterIdx === -1 ? null : filterIdx;
          } else if (sortCols !== null){
              // horrible inefficient, need an index into the sortSet
              return sortSet.findIndex(([ind]) => ind === rowIdx);
          } else {
              return rowIdx;
          }
      }).filter(value => value !== null);
  }

}
