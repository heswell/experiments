import { createLogger, logColor, EventEmitter } from '@heswell/utils';
import { metaData } from '../store/columnUtils';
import { DataTypes } from '../store/types';
import { NOT_IN, IN } from '../store/filter';

const logger = createLogger('FilterDataView', logColor.brown);

/**
 * This is a specialized wrapper around  a regular data-view (local or remote).
 * It is specifically for a data list that is being used to filter the underlying
 * data-view. 
 */

// TODO shall we inherit from EventEmitter, so we can host multiple dataCount subscriptions ?
export default class FilterDataView extends EventEmitter {

    constructor(dataView, column){
        super();
        this.dataView = dataView;
        this.column = column;
        this.dataCounts = undefined;
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
            this.dataCounts = dataCounts;
            this.emit('data-count', dataCounts);
            if (this.dataCountCallback){
                this.dataCountCallback(dataCounts);
            }    
        })
    }

    unsubscribe(){
        this.dataView.unsubscribeFromFilterData();
    }

    destroy(){
        logger.log(`<destroy>`)
        this.dataView.unsubscribeFromFilterData(this.column);
    }

    select(idx, row){
        const {KEY, SELECTED} = this.meta;
        const key = row[KEY];
    
        const filter = {
            type: row[SELECTED] === 1 ? NOT_IN : IN,
            colName: this.column.name,
            values: [key]
        }
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

