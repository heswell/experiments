import {EventEmitter} from '@heswell/utils';
import {DataTypes} from '../store/types';

export default class FilterView extends EventEmitter {
    _dataView;
    constructor(dataView, column){
        super();
        this._dataView = dataView;
        this.column = column;
        console.log(`filterView attach listener to dataView`)
        dataView.on(DataTypes.FILTER_DATA, this.onFilterData);
    }

    destroy(){
        console.log(`filterView remove listener`)
        this._dataView.removeListener(DataTypes.FILTER_DATA, this.onFilterData);
    }

    onFilterData = (msgType, rows, rowCount, selected) => {
        console.log(`FilterView<${this.column.name}> emit 
            selected ${JSON.stringify(selected)} ` +
            (rows.length
                ? ` rowData ${rows[0][0]}(${rows[0][4]}) - ${rows[rows.length-1][0]} (${rows[rows.length-1][4]})`
                : ` no data`)
        );
        this.emit(DataTypes.ROW_DATA,rows, rowCount, selected);
    }

    selectAll(){
        const selected = this.getSelectedIndices();
        const dataIndices = this._dataView.filterRows.map(row => row[0]);
        const set = new Set(selected.concat(dataIndices));
        return Array.from(set).sort();
    }

    get size(){
        return this._dataView.getFilterDataCount();
    }

    get columns (){
        return [{name: 'name'},{name:'count',width: 60, type:'number'}];
    }

    setRange(lo, hi, sendDelta){
        this._dataView.setRange(lo,hi, sendDelta, DataTypes.FILTER_DATA);
    }

    itemAtIdx(idx){
        return this._dataView.filterRows.find(r => r[0] === idx);
    }

    indexOf(value){
        const item = this._dataView.filterRows.find(r => r[4] === value);
        return item ? item[0] : -1;
    }
  
    getSelectedIndices(){
        return this._dataView.getFilterDataSelected();
    }

}

