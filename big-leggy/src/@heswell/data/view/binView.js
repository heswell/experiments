import {EventEmitter} from '@heswell/utils';
import {DataTypes} from '../store/types';

//TODO how much of the stuff in here actually makes sense for binned views ?
// TODO fins a better approach than extending EventEMitter

export default class BinView extends EventEmitter {
    _dataView;
    constructor(dataView){
        super();
        this._dataView = dataView;
        dataView.on(DataTypes.FILTER_DATA, this.onFilterBins);
    }

    destroy(){
        this._dataView.removeListener(DataTypes.FILTER_DATA, this.onFilterBins);
    }

    onFilterBins = (_, bins) => {
        this.emit(DataTypes.FILTER_DATA, bins);
    }

    get size() { 
        return this._dataView.getFilterDataCount();
    }

    get columns (){
        return [{name: 'name'},{name:'count',width: 50, type:'number'}];
    }

    setRange(lo, hi, sendDelta){
        debugger;
        this._dataView.setRange(lo,hi, sendDelta, DataTypes.FILTER_DATA);
    }

    sort(sortCriteria){
        console.log(`filterView sort ${JSON.stringify(sortCriteria)}`);
    }

    filter(filter){
        console.log(`filterlView filter ${JSON.stringify(filter)}`);
    }    

    groupBy(groupBy){
        console.log(`filterView groupBy ${JSON.stringify(groupBy)}`);
    }

    itemAtIdx(idx){
        return this._dataView.filterRows.find(r => r[0] === idx);
    }

    indexOf(value){
        //TODO get the meta KEY
        const item = this._dataView.filterRows.find(r => r[4] === value);
        return item ? item[0] : -1;
    }
  
    getBins(){
        return this._dataView.filterRows;
    }

    getRows(/*dataOptions*/){
        return [this._dataView.filterRows, this.size, this.getSelectedIndices()];
    }

    setColumns(/*columns*/){
        // this._dataOptions.columns = columns.map(toColumn);
    }

    getSelectedIndices(){ 
        return this._dataView.getFilterDataSelected();
    }

}

