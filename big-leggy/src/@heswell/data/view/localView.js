import {EventEmitter} from '@heswell/utils';
import {DataTypes} from '../store/types';
import InMemoryView from '../store/InMemoryView';
import LocalUpdateQueue from '../store/localUpdateQueue';
import {NULL_RANGE} from '../store/rangeUtils';
import {setFilterColumnMeta} from '../store/filterUtils';
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

        this.processRowData = this.processRowData.bind(this);
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

            this.updateQueue.on(DataTypes.ROW_DATA,this.processRowData)
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

    processRowData(evtName, rows, size){
        this._rowData.rows = rowUtils.mergeAndPurge(this._rowData, rows, size, this.meta);
        this.emit(evtName, this._rowData.rows, size);
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

    get size(){ 
        return this._dataView === null
            ? 0
            : this._dataView.size;
    }

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

    // setData(data){
    //     const {columns, sortBy: sortCriteria, groupBy} = this._dataOptions;
    //     const table = new Table({data, columns});
    //     const tableHelper = new TableHelper(table);
    //     this._dataView = new InMemoryView(tableHelper, {columns, sortCriteria, groupBy});
    //     const {rows, size} = this._dataView.setRange(this._rowData.range);
    //     this._rowData.rows = rows;
    //     return [rows, size];
    // }

    setRange(lo, hi, useDelta=true, dataType=DataTypes.ROW_DATA){
        const [targetData, meta] = this.getData(dataType);
        if (targetData.type !== DataTypes.FILTER_BINS){
            const { range: { lo: lo_, hi: hi_ }} = targetData;
            if (useDelta === false || (lo !== lo_ || hi !== hi_)) {
                targetData.range = { lo, hi };
                if (this._dataView){
                    const {rows, size,selectedIndices} = this._dataView.setRange({lo, hi}, useDelta, dataType);
                    const rowset = rowUtils.mergeAndPurge(targetData, rows, size, meta);
                    targetData.rows = rowset;
                    this.emit(dataType, rowset, size, selectedIndices);
                }
            }
        }
    }

    sort(sortCriteria){
        const targetData = this._rowData;
        const {rows, size, selectedIndices} = this._dataView.sort(sortCriteria);
        const rowset = rowUtils.mergeAndPurge(targetData, rows, size, this.meta); // NEEDED ?
        targetData.rows = rowset;
        this.emit(DataTypes.ROW_DATA, rowset, size, selectedIndices);
    }

    filter(filter){
        const {rows, size} = this._dataView.filter(filter);
        const [targetData, meta] = this.getData(DataTypes.ROW_DATA);
        const rowset = rowUtils.mergeAndPurge(targetData, rows, size, meta);
        targetData.rows = rowset;
        this.emit(DataTypes.ROW_DATA, rowset, size);
    }

    select(dataType, colName, selectMode){
        const {rows, size, selectedIndices} = this._dataView.select(dataType, colName, selectMode);
        if (dataType === DataTypes.FILTER_DATA){
            const [targetData, meta] = this.getData(DataTypes.ROW_DATA);
            const rowset = rowUtils.mergeAndPurge(targetData, rows, size, meta); // NEEDED ?
            targetData.rows = rowset;
            this.emit(DataTypes.ROW_DATA, rowset, size, selectedIndices);
        }

    }

    groupBy(groupBy){
        const targetData = this._rowData;
        const {rows, size, selectedIndices} = this._dataView.groupBy(groupBy);
        const rowset = rowUtils.mergeAndPurge(targetData, rows, size, this.meta); // NEEDED ?
        targetData.rows = rowset;
        this.emit(DataTypes.ROW_DATA, rowset, size, selectedIndices);
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

    getFilterData(column, searchText=null){
        const range = this._filterData /* && (searchText || this._filterData.searchText) */
            ? this._filterData.range
            : NULL_RANGE;

        // when we have set data, need to save meta someghow

        this._filterData = this._dataView.getFilterData(column, searchText, range);
        
        // shoulf getFilterData return this ?
        this._filterData.searchText = searchText;

        // emit data if range specified or not required
        if (this._filterData.type === DataTypes.FILTER_BINS || range !== NULL_RANGE){
            const {rows, size} = this._filterData;
            // there is no listener for this when we emit binned Filter data (no range required)
            // but that's ok, the BinView will ask for them when it's ready
            this.emit(DataTypes.FILTER_DATA, rows, size);
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

