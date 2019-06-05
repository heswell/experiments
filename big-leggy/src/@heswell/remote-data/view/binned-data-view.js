//TODO neither this file nor filter-data-view belong here - thye are not specific to remote views

import { DataTypes } from '../../data/store/types';
import { metaData } from '../../data/store/columnUtils';
import {
  createLogger, logColor
} from '../constants';

const logger = createLogger('BinnedDataView', logColor.brown);

export default class BinnedDataView {

  constructor(dataView, column) {
    this.dataView = dataView;
    this.column = column;
    this.dataCountCallback = null;
  }

  subscribe({range}, callback) {
    logger.log(`<subscribe>`)

    this.dataView.subscribeToFilterData(this.column, range, message => {

      logger.log(`callback ${JSON.stringify(message.null, 2)}`)
      const {filterData} = message;
      const {rows, size, range, dataCounts} = filterData;

      logger.log(`receive rows ${rows.length} of ${size} range ${JSON.stringify(range)}`, message)

      // const mergedRows = this.processData(rows, size, 0)

      callback(rows);

      // if (this.dataCountCallback){
      //     this.dataCountCallback(dataCounts);
      // }


    })

  }

  destroy(){
    logger.log(`<destroy>`)
    this.dataView.unsubscribeFromFilterData(this.column);
}

}