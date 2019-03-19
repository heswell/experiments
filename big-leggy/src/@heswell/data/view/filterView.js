import {EventEmitter} from '@heswell/utils';
import {DataTypes} from '../store/types';
import {metaData} from '../store/columnUtils';

export default class FilterView extends EventEmitter {
    _dataView;
    constructor(dataView, column){
        super();
        this._dataView = dataView;
        this.column = column;
        this.meta = metaData(this.columns);
        console.log(`filterView attach listener to dataView`)
        dataView.on(DataTypes.FILTER_DATA, this.onFilterData);
    }

    subscribe(columns, callback){
        console.log(`FilterView subscribe to ${JSON.stringify(columns)}`)
        this.on(DataTypes.ROW_DATA, callback);
    }

    unsubscribe(){
        this.removeAllListeners();
    }

    destroy(){
        console.log(`filterView remove listener`)
        this._dataView.removeListener(DataTypes.FILTER_DATA, this.onFilterData);
    }

    onFilterData = (msgType, rows, rowCount) => {
        this.emit(DataTypes.ROW_DATA, rows, rowCount);
    }

    // selectAll(){
    //     const {IDX} = this.meta;
    //     const selected = this.getSelectedIndices();
    //     const dataIndices = this._dataView.filterRows.map(row => row[IDX]);
    //     const set = new Set(selected.concat(dataIndices));
    //     return Array.from(set).sort();
    // }

    get size(){
        return this._dataView.getFilterDataCount();
    }

    get columns (){
        return [
            {name: 'name', key: 0},
            {name:'count',width: 40, type:'number', key: 1},
            {name:'totalCount',width: 40, type:'number', key: 2}
        ];
    }

    setRange(lo, hi, sendDelta){
        this._dataView.setRange(lo,hi, sendDelta, DataTypes.FILTER_DATA);
    }

    itemAtIdx(idx){
        const {IDX} = this.meta;
        return this._dataView.filterRows.find(r => r[IDX] === idx);
    }

    indexOf(value){
        const {IDX, KEY} = this.meta;
        const item = this._dataView.filterRows.find(r => r[KEY] === value);
        return item ? item[IDX] : -1;
    }
  
    getSelectedIndices(){
        return this._dataView.getFilterDataSelected();
    }

}

