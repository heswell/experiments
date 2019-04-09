
import {metaData} from '../data/store/columnUtils';
import { DataTypes, NULL_RANGE, columnUtils, rangeUtils, rowUtils } from '@heswell/data';
import {setFilterColumnMeta, binFilterColumnMeta} from '../data/store/columnUtils';
import {EventEmitter} from '@heswell/utils';
import {subscribe} from './server-api';
const uuid = require('uuid');

export default class RemoteView extends EventEmitter {

    _id;
    _table;
    _dataOptions;
    _subscription;
    _rowData;
    _filterData;

    constructor(viewParams) {
        super();

        const {
            id,
            tablename,
            columns,
            filter = null,
            range = { lo: 0, hi: 0 },
            sortCriteria = null,
            groupBy = null,
            groupState = null
        } = viewParams;

        this._id = id || uuid.v1();
        this._table = tablename;

        this._rowData = {
            rows: [],
            size: 0,
            range,
            offset: 0
        };

        this._dataOptions = {
            columns: columns !== undefined
                ? columns.map(columnUtils.toColumn)
                : [],
            sortBy: sortCriteria,
            filter,
            groupBy,
            groupState
        };

        this.meta = metaData(this._dataOptions.columns);
        this.columnMap = columnUtils.buildColumnMap(this._dataOptions.columns);

    }

    getData(dataType, filterType) {
        return dataType === DataTypes.ROW_DATA
            ? [this._rowData, this.meta]
            : dataType === DataTypes.FILTER_DATA
                ? [
                    this._filterData,
                    filterType === DataTypes.FILTER_BINS ? binFilterColumnMeta : setFilterColumnMeta
                ]
                : [null];
    }

    subscribe(columns, callback) {
        this._subscription = subscribe({
            viewport: this._id,
            tablename: this._table,
            columns: this._dataOptions.columns,
            range: this._rowData.range,
            sortCriteria: this._dataOptions.sortBy,
            filter: this._dataOptions.filter,
            groupBy: this._dataOptions.groupBy,
            groupState: this._dataOptions.groupState
        });

        // TODO how will this unteract with filterdata
        this.on(DataTypes.ROW_DATA, callback)

        this._subscription.onData = message => {
            console.log(`RemoteView.subscription.receive message:${message.type}`);
            const { type } = message;

            switch (type) {

                case 'size':
                    console.log('%cRemoteView size only, size = ' + message.size,'color:blue;font-weight:bold;');
                    this._rowData.size = message.size;
                    if (message.size === 0) {
                        this._rowData.rows = rowUtils.mergeAndPurge(this._rowData, [], 0, this.meta);
                        this.emit(DataTypes.ROW_DATA, this._rowData.rows, this._rowData.size);
                    } else {
                        // size change will cause scrollbar t redraw
                        this.emit(DataTypes.ROW_DATA, null, this._rowData.size);
                    }
                    break;

                case DataTypes.FILTER_DATA:
                case DataTypes.ROW_DATA:

                    const rowSet = message[type];
                    const [targetData, meta] = this.getData(type, rowSet.type);
                    const { data, size, offset = targetData.offset, dataCounts } = rowSet;

                    targetData.size = size;
                    targetData.offset = offset;
                    // we don't currently use a range with binData, so merge and purge won't work
                    targetData.rows = rowSet.type === DataTypes.FILTER_BINS
                        ? rowSet.data
                        : rowUtils.mergeAndPurge(targetData, data, size, meta);

                    this.emit(type, targetData.rows, size, undefined, dataCounts);

                    break;

                case 'subscribed':

                //onsole.log('%cRemoteView subscribed','color:blue;font-weight:bold;');
                    this._rowData.size = message.size;
                    this._rowData.offset = message.offset;
                    break;

                case 'update':

                // onsole.log(`%cRemoteView. receive 'update'  ${message.updates.length} rows 
                // updates [${message.updates.map(r=>r.join('\n'))}]
                // `,'color:vrown;font-weight:bold');

                    this._rowData.rows = rowUtils.update(this._rowData.rows, this._rowData.range, message.updates, this.meta);

                    this.emit(DataTypes.ROW_DATA, this._rowData.rows);
                    break;

                default:
                    console.log(`RemoteVide no handler for ${JSON.stringify(message)}`);
            }
        };

    }

    unsubscribe(){
        this.removeAllListeners();
        // wat else
    }

    set table(name) {
        this._table = name;
        this.subscribe();
    }

    set columns(columns){
        console.log(`[RemoteView] set columns ${JSON.stringify(columns)}`)
        if (this._subscription){
            this._subscription.setColumns(columns);
        }
    }

    get columns() {
        return this._dataOptions.columns;
    }

    get data() {
        return this._rowData.rows;
    }

    // get size() {
    //     return this._rowData.size || 0;
    // }

    //TODO first bring server-api setViewRange & setFilterRange into line, then merge followig methods
    setRange(lo, hi, useDelta=true, dataType = DataTypes.ROW_DATA) {
        const [targetData, meta] = this.getData(dataType);
        if (targetData.type !== DataTypes.FILTER_BINS){
            //onsole.log(`%cRemoteView.setRange<${dataType}> ${lo} - ${hi}`,'color:blue;font-weight:bold;');
            const { range: { lo: lo_, hi: hi_ }, rows } = targetData;
            if (useDelta === false || (lo !== lo_ || hi !== hi_)) {
                targetData.range = { lo, hi };

                if (this._subscription) {
                    // this call might be synchronously fulfilled by cache layer in serverproxy...
                    this._subscription.setRange(lo, hi, dataType);

                    // ... in which case these will be different
                    if (targetData.rows !== rows) {
                        // still need to check if we have enought to fill the viewport
                    } else {
                        if (lo >= hi_ || hi < lo_) {
                            // no overlap, send back the full range requested
                            targetData.rows = rowUtils.purgeAndFill(targetData, meta);
                        } else {
                            lo = lo < lo_ ? lo_ : lo;
                            hi = hi > hi_ ? hi_ : hi;

                            targetData.rows = rowUtils.purgeAndFill(targetData, meta);
                        }
                        // we should immediately postData with empty rows for the new data here
                        this.emit(dataType, targetData.rows, targetData.size /* selected ? */);
                    }
                }
            }

        }
    }

    //TODO these can all be simplified
    groupBy(groupBy, extendsExistingGroupBy=false) {
        const {range} = this._rowData;
        this._rowData.size = 0;
        this._rowData.rows.length = 0;
        this._rowData.range = rangeUtils.resetRange(range);

        this._subscription.groupBy(groupBy);

        if (!extendsExistingGroupBy){
            this._rowData.rows = rowUtils.mergeAndPurge(this._rowData, [], 0, this.meta);
            this.emit(DataTypes.ROW_DATA, this._rowData.rows, this._rowData.size);
        }

    }

    setGroupState(groupState) {
        this._subscription.setGroupState(groupState);
    }

    sort(sortCriteria) {
        this._subscription.sort(sortCriteria);
    }

    filter(filter) {
        this._subscription.filter(filter);
    }

    get filterRows () {
        return this._filterData
            ? this._filterData.rows || this._filterData.values
            : [];
    }

    getFilterData(column, searchText=null) {

        const range = this._filterData && (searchText || this._filterData.searchText)
            ? this._filterData.range
            : NULL_RANGE;

        this._subscription.getFilterData(column, searchText, range);

        this._filterData = {
            columnName: column.name,
            searchText,
            rows: [],
            range,
            size: 0
        };
    }

    getFilterDataCount = () => this._filterData.size;

    disconnect() {
        this._subscription.cancel();
        this._subscription = null;
        this._rowData.rows = [];
    }

    destroy() {

    }

}
