import {EventEmitter} from '@heswell/utils';
import {DataTypes} from '../store/types';
import InMemoryView from '../store/InMemoryView';
import LocalUpdateQueue from '../store/localUpdateQueue';
import {NULL_RANGE} from '../store/rangeUtils';
import {setFilterColumnMeta} from '../store/filter';
import * as columnUtils from '../store/columnUtils';
import * as rowUtils from '../store/rowUtils';

const NULL_DATARANGE = {
    range: NULL_RANGE,
    rows: [],
    offset: 0,
    size: 0
};

const emptyConfig = {}

export default class LocalView extends EventEmitter {

    constructor(config=emptyConfig){
        super();

        this._dataOptions = null;
        this._table = null;
        this._dataView = null;
        this._rowData = null;
        this._filterData = null;

        this.processIncomingRows = this.processIncomingRows.bind(this);
        this.processUpdate = this.processUpdate.bind(this);

        const {
            table=null,
            columns,
            filter,
            range = NULL_RANGE,
            sortCriteria,
            groupBy,
            groupState
        } = config;

        if (table !== null){
            const viewColumns = columns || table.columns;
            this.updateQueue = new LocalUpdateQueue();
            this._dataView = new InMemoryView(table, {columns: viewColumns, sortCriteria, groupBy}, this.updateQueue);

            if (this._dataView.status === 'ready'){
                this._rowData = this._dataView.setRange(range) || NULL_DATARANGE;
            }

            this.updateQueue.on(DataTypes.ROW_DATA,this.processIncomingRows)
            this.updateQueue.on('update',this.processUpdate)
            this.updateQueue.on('insert', (evtName, message) => this.emit('insert', message))

        } else {
            this._rowData = {
                range,
                rows: [],
                size: 0,
                offset: 0
            };
        }

        this._dataOptions = {
            columns: columns !== undefined
                ? columns.map(columnUtils.toColumn)
                : table !== null
                    ? table.columns.map(columnUtils.toColumn)
                    : [],
            sortBy: sortCriteria,
            filter,
            groupBy,
            groupState
        };

        this.columnMap = columnUtils.buildColumnMap(this._dataOptions.columns);
        this.meta = columnUtils.metaData(this._dataOptions.columns)
        //TODO need separate meta for filterData
    }

    subscribe(columns, callback){
        this.on(DataTypes.ROW_DATA, callback);
    }

    unsubscribe(){
        this.removeAllListeners();
    }

    processIncomingRows(dataType, rows, size, totalCount, filterCount, appliedFilterCount, selectedCount){
console.log('[LocalView] processIncomingRows size=${size} totalCOunt=${totalCount} filterCount=${filterCount} appliedFilterCount=${appliedFilterCount} selectedCount=${selectedCount}' )
        const [targetData, meta] = this.getData(dataType);
        const rowset = targetData.rows = rowUtils.mergeAndPurge(targetData, rows, size, meta);
        this.emit(dataType, rowset, size, totalCount, filterCount, appliedFilterCount, selectedCount);
    }

    processUpdate(evtName, updates){
        this._rowData.rows = rowUtils.update(this._rowData.rows, this._rowData.range, updates, this.meta);
        this.emit(DataTypes.ROW_DATA, this._rowData.rows);
    }

    set table (name) {
        this._table = name;
    }

    // Why have 2 ways to set columns 
    set columns (columns) {
        this._dataOptions.columns = columns.map(columnUtils.toColumn);
    }

    // get size(){ 
    //     return this._dataView === null
    //         ? 0
    //         : this._dataView.size;
    // }

    get columns (){
        return this._dataOptions.columns;
    }

    // duplicated in remoteView
    getData(dataType) {
        return dataType === DataTypes.ROW_DATA
            ? [this._rowData, this.meta]
            : dataType === DataTypes.FILTER_DATA
                ? [this._filterData, setFilterColumnMeta]
                : [null];
    }

    setRange(lo, hi, useDelta=true, dataType=DataTypes.ROW_DATA){
        const [targetData] = this.getData(dataType);
        if (targetData.type !== DataTypes.FILTER_BINS){
            const { range: { lo: lo_, hi: hi_ }} = targetData;
            if (useDelta === false || (lo !== lo_ || hi !== hi_)) {
                targetData.range = { lo, hi };
                if (this._dataView){
                    // TODO the counts will never change during a setRange operation
                    const {rows, size, totalCount, filterCount, appliedFilterCount, selectedCount} = this._dataView.setRange({lo, hi}, useDelta, dataType);
                    this.processIncomingRows(dataType, rows, size, totalCount, filterCount, appliedFilterCount, selectedCount)
                }
            }
        }
    }

    sort(sortCriteria){
        const {rows, size} = this._dataView.sort(sortCriteria);
        this.processIncomingRows(DataTypes.ROW_DATA, rows,size)
    }

    filter(filter, dataType=DataTypes.ROW_DATA){
        if (dataType === DataTypes.FILTER_DATA){
            const {rows, size, totalCount, filterCount,appliedFilterCount, selectedCount} = this._dataView.filter(filter, dataType);
            this.processIncomingRows(DataTypes.FILTER_DATA, rows, size, totalCount, filterCount, appliedFilterCount, selectedCount);
        } else {
            const [{rows, size, totalCount, filterCount}, ...filterResultsets] = this._dataView.filter(filter);
            filterResultsets.forEach(({rows, size, totalCount, filterCount, appliedFilterCount, selectedCount}) => {
                this.processIncomingRows(DataTypes.FILTER_DATA, rows, size, totalCount, filterCount, appliedFilterCount, selectedCount);
            })
            this.processIncomingRows(DataTypes.ROW_DATA, rows, size, totalCount, filterCount)
        }
    }

    select(dataType, colName, selectMode){
        const {rows, size} = this._dataView.select(dataType, colName, selectMode);
        if (dataType === DataTypes.FILTER_DATA){
            const [targetData, meta] = this.getData(DataTypes.ROW_DATA);
            const rowset = rowUtils.mergeAndPurge(targetData, rows, size, meta); // NEEDED ?
            targetData.rows = rowset;
            this.emit(DataTypes.ROW_DATA, rowset, size);
        }

    }

    groupBy(groupBy){
        const targetData = this._rowData;
        const {rows, size} = this._dataView.groupBy(groupBy);
        const rowset = rowUtils.mergeAndPurge(targetData, rows, size, this.meta); // NEEDED ?
        targetData.rows = rowset;
        this.emit(DataTypes.ROW_DATA, rowset, size);
    }

    setGroupState(groupState){
        const targetData = this._rowData;
        const {rows, size} = this._dataView.setGroupState(groupState);
        const rowset = rowUtils.mergeAndPurge(targetData, rows, size, this.meta); /// NEEDED ?
        targetData.rows = rowset;
        this.emit(DataTypes.ROW_DATA, rowset, size);
    }

    itemAtIdx(idx){
        const offset = 100; // where does this get set
        const pos = idx + offset;
        return this._rowData.rows.find(r => r[0] === pos);
    }

    get filterRows () {
        return this._filterData
            ? this._filterData.rows
            : [];
    }

    // TODO add support for filter, so we can filter out zero-value filterCount
    getFilterData(column, searchText=null, filter=null){
        const range = this._filterData /* && (searchText || this._filterData.searchText) */
            ? this._filterData.range
            : NULL_RANGE;

        // when we have set data, need to save meta someghow

        this._filterData = this._dataView.getFilterData(column, searchText, range);
        
        // should getFilterData return this ? YES
        this._filterData.searchText = searchText;

        // emit data if range specified or not required
        if (this._filterData.type === DataTypes.FILTER_BINS || range !== NULL_RANGE){
            const {rows, size, filterCount, totalCount, appliedFilterCount, selectedCount} = this._filterData;
            // there is no listener for this when we emit binned Filter data (no range required)
            // but that's ok, the BinView will ask for them when it's ready
            console.log(`[LocalView emit FILTERDATA filterCount=${filterCount} / ${totalCount}]`)
            this.emit(DataTypes.FILTER_DATA, rows, size, totalCount, filterCount, appliedFilterCount, selectedCount);
        }
    }

    setFilterDataRange(range){

        if (this._filterData){
            const {lo,hi} = this._filterData.range;
            if (lo === range.lo && hi === range.hi){
                return {
                    data: this._filterData.rows,
                    size: this._filterData.size
                };
            }
        }

        const {data,size} = this._dataView.getFilterDataRange(range);
        this._filterData.range = range;
        this._filterData.size = size;
        this._filterData.rows = rowUtils.mergeAndPurge(this._filterData, data, size, this.meta);

        // we might have more data in cache than required, only emit rows specified in range
        this.emit(DataTypes.FILTER_DATA, this._filterData.rows, size);
    }

    getFilterDataCount = () => this._filterData.size;

    setColumns(columns){
        this._dataOptions.columns = columns.map(columnUtils.toColumn);
    }

   setColumnType(columnName, type){
        this._dataOptions.columns = this._dataOptions.columns.map(
            column => column.name === columnName
                ? { ...column, type }
                : column
        );
   }

   disconnect(){
        //TODO complete reset of rowData
        this._rowData.rows = [];
   }

    destroy(){
        this.updateQueue.removeAllListeners();
    }

}

