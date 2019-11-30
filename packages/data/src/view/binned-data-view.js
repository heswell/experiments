//TODO neither this file nor filter-data-view belong here - thye are not specific to remote views

import { createLogger, logColor} from '@heswell/utils';

const logger = createLogger('BinnedDataView', logColor.brown);

export default class BinnedDataView {

  constructor(dataView, column) {
    this.dataView = dataView;
    this.column = column;
    this.dataCountCallback = null;
  }

  subscribe({range}, callback) {
    logger.log(`subscribe`)

    this.dataView.subscribeToFilterData(this.column, range, ({rows,size, range}) => {

      logger.log(`receive rows ${rows.length} of ${size} range ${JSON.stringify(range)}`)

      callback(rows);

    })

  }

  filter(filter){
    logger.log(`filter ${JSON.stringify(filter)}`)
  }

  destroy(){
    logger.log(`<destroy>`)
    this.dataView.unsubscribeFromFilterData(this.column);
}

}