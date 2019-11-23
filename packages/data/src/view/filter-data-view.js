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
export default class FilterDataView extends EventEmitter {

    constructor(dataView, column){
        super();
        // can we listen for destroy event ?
        this.dataView = dataView;
        this.column = column;
        // this.dataCounts = undefined;
        // why do we need to store the range ?
        this.range = null;
    }

    subscribe({columns, range}, callback){

        console.log(`filter-data-view subscribe ${JSON.stringify(range)}`)
        this.columns = columns;
        this.meta = metaData(columns);
        //TODO make range s setter
        this.range = range;
        this.keyCount = range.hi - range.lo;

        const cb = this.clientCallback = message => {
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

        // this.dataView.subscribeToFilterData(this.column, this.range, cb)

        cb(this.dataView.dataView.getFilterData({ name: this.column.name}, null, range));
    }

    unsubscribe(){
        this.dataView.unsubscribeFromFilterData();
    }

    destroy(){
        logger.log(`<destroy>`)
        this.dataView.unsubscribeFromFilterData(this.column);
    }

    setRange(lo, hi){
        if (lo !== this.range.lo && hi !== this.range.hi){
            this.clientCallback(this.dataView.dataView.setRange(this.range = { lo, hi }, true, DataTypes.FILTER_DATA));
        }
      }
  
    select(idx, rangeSelect, keepExistingSelection) {
        this.clientCallback(this.dataView.dataView.select(idx, rangeSelect, keepExistingSelection, DataTypes.FILTER_DATA))
      }
    
    selectAll(){
        this.clientCallback(this.dataView.dataView.selectAll(DataTypes.FILTER_DATA));
    }

    selectNone(){
        this.clientCallback(this.dataView.dataView.selectNone(DataTypes.FILTER_DATA));
    }
    
    filter(filter, dataType = DataTypes.FILTER_DATA, incremental=false){
        const [,filterData] = this.dataView.dataView.filter(filter, dataType, incremental);
        this.clientCallback(filterData);
    }
  
}

