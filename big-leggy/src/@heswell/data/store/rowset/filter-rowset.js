import {RowSet} from './rowSet';
import {extractFilterForColumn} from '../filterUtils';
import { projectColumnsFilter } from '../columnUtils';

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

  setSelected(filter){

    const columnFilter = extractFilterForColumn(filter, this.columnName);
      if (columnFilter){

        this.project = projectColumnsFilter(
          this.table.columnMap,
          this.columns,
          this.meta,
          columnFilter);
          
        // make sure next scroll operation sends a full rowset otw client-side selection changes may
        // be lost ac changes will not exist in cached rows.  
        this.setRange({lo: 0,hi: 0});

      }

}

}
