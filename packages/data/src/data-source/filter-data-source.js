import { createLogger, logColor, EventEmitter } from '@heswell/utils';
import { metaData } from '../store/columnUtils';
import { DataTypes } from '../store/types';

const logger = createLogger('FilterDataView', logColor.brown);

/**
 * This is a specialized wrapper around  a regular data-view (local or remote).
 * It is specifically for a data list that is being used to filter the underlying
 * data-view. 
 */

// TODO shall we inherit from EventEmitter, so we can host multiple dataCount subscriptions ?
// This needs to be a local-filter-data-view
export default class FilterDataSource extends EventEmitter {

    constructor(dataView, column, options={}){
        super();
        // can we listen for destroy event ?
        this.dataSource = dataView;
        this.column = column;
        // this.dataCounts = undefined;
        // why do we need to store the range ?
        this.range = null;
        // TODO - works but ugly
        this.options = options;
    }

    subscribe({columns, range}, callback){

        logger.log(`filter-data-view subscribe ${JSON.stringify(range)}`)
        this.columns = columns;
        this.meta = metaData(columns);
        //TODO make range s setter - DO WE EVEN NEED RANGE ?
        this.range = range;
        this.keyCount = range.hi - range.lo;

        const cb = this.clientCallback = (message) => {
            if (message){
                const {stats, ...data} = message;
                console.log(`filter-data-local stats=${JSON.stringify(stats,null,2)}`)
                callback(data);
                // this.dataCounts = dataCounts;
                if (stats){
                    this.emit('data-count',stats);
                }
            }
        }

        this.dataSource.subscribeToFilterData(this.column, range, cb);

        // This can't be called until subscribeToFilterData is called, as the filterSet will not have been created on dataView
        if (this.options.filter){
            this.filter(this.options.filter)
        }
    }

    unsubscribe(){
        this.dataSource.unsubscribeFromFilterData();
    }

    destroy(){
        logger.log(`<destroy>`)
        this.dataSource.unsubscribeFromFilterData(this.column);
    }

    setRange(lo, hi){
        if (lo !== this.range.lo || hi !== this.range.hi){
            this.range = {lo, hi};
            this.dataSource.setRange(lo, hi, DataTypes.FILTER_DATA);
        }
      }
  
    select(idx, rangeSelect, keepExistingSelection) {
        this.dataSource.select(idx, rangeSelect, keepExistingSelection, DataTypes.FILTER_DATA);
      }
    
    selectAll(){
        this.dataSource.selectAll(DataTypes.FILTER_DATA);
    }

    selectNone(){
        this.dataSource.selectNone(DataTypes.FILTER_DATA);
    }
    
    filter(filter, dataType = DataTypes.FILTER_DATA, incremental=false){
        this.dataSource.filter(filter, dataType, incremental);
    }
  
}

