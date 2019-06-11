import {DataTypes} from '../../data/store/types';
import {metaData} from '../../data/store/columnUtils';
import { NOT_IN, IN } from '../../data/store/filter';
import {
  createLogger, logColor
} from '../constants';

const logger = createLogger('FilterDataView', logColor.brown);

export default class FilterDataView {

  constructor(dataView, column){
        this.dataView = dataView;
        this.column = column;
        this.dataCountCallback = null;
    }

    subscribe({columns, range}, callback){

        this.columns = columns;
        this.meta = metaData(columns);
        //TODO make range s setter
        this.range = range;
        this.keyCount = range.hi - range.lo;

        this.dataView.subscribeToFilterData(this.column, this.range, message => {
            const {filterData: {dataCounts, ...data}} = message;
            callback(data);
            if (this.dataCountCallback){
                this.dataCountCallback(dataCounts);
            }    
        })
    }

    subscribeToDataCounts(callback){
        this.dataCountCallback = callback;
    }
    unsubscribeFromDataCounts(){
        this.dataCountCallback = null;
    }

    unsubscribe(){
        this.dataView.unsubscribeFromFilterData();
    }

    destroy(){
        logger.log(`<destroy>`)
        this.dataView.unsubscribeFromFilterData(this.column);
    }

    // onFilterData = (_, rows, rowCount, totalCount, dataCounts) => {
    //     this.emit(DataTypes.ROW_DATA, rows, rowCount, totalCount, dataCounts);
    // }

    select(idx, row){
        const {KEY, SELECTED} = this.meta;
        const key = row[KEY];
    
        const filter = {
            type: row[SELECTED] === 1 ? NOT_IN : IN,
            colName: this.column.name,
            values: [key]
        }
        // This is enough to filter rows and populate filter display - but how can we add filter markers to UI ?
        this.dataView.filter(filter, DataTypes.ROW_DATA, true);
    
    }

    filter(filter, dataType = DataTypes.FILTER_DATA, incremental=false){
        this.dataView.filter(filter, dataType, incremental);
    }

    getFilterData(column, searchText){
        console.log(`FilterDataView.getFilterData ${JSON.stringify(column)} ${searchText}`)
        this.dataView.getFilterData(column, searchText);
    }

    // TODO we need a filter method to filter results to omit zero value filterCount - call getFilterData on view, passing filter

    setRange(lo, hi){
      this.range = { lo, hi };
      this.dataView.setFilterRange(lo,hi);
    }

    sort(){
        
    }
  
}

