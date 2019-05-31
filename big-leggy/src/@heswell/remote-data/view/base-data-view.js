export default class BaseDataView {

  constructor(){
    this.columns = null;
    this.meta = null;

    this.range = {lo:0, hi:0};
    this.size = 0;
    this.dataRows = [];

  }

  clearData(){
    const {dataRows} = this;    
    dataRows.length = 0;
  }

  set rows(newRows) {
    this.dataRows = newRows;
  }

  get rows() {
    return this.dataRows;
  }

}