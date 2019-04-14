import { DataTypes } from '../data/store/types';
import {msgType as Msg} from './constants';
import { postMessageToWorker } from './client-hosted/worker';

export default class RemoteSubscription {
  constructor(viewport, postMessageToServer, postMessageToClient){
      this.viewport = viewport;
      this.postMessageToServer = postMessageToServer;
      this.postMessageToClient = postMessageToClient;
  }

  setRange(lo, hi, dataType=DataTypes.ROW_DATA){
    this.postMessageToServer({
          // clientId,
          viewport: this.viewport,
          type: postMessageToWorker.setRange,
          range: {lo,hi},
          dataType
      })
  }

  groupBy(columns){
    this.postMessageToServer({
          viewport: this.viewport,
          type: Msg.groupBy,
          groupBy: columns
      })
  }

  setGroupState(groupState){
    this.postMessageToServer({
          viewport: this.viewport,
          type: Msg.setGroupState,
          groupState
      })
  }

  sort(columns){
    this.postMessageToServer({
          viewport: this.viewport,
          type: Msg.sort,
          sortCriteria: columns
      })
  }

  filter(filter, dataType=DataTypes.ROW_DATA){
    this.postMessageToServer({
          viewport: this.viewport,
          type: Msg.filter,
          dataType,
          filter
      })
  }

  getFilterData(column, searchText, range){
    this.postMessageToServer({
          viewport: this.viewport,
          type: Msg.getFilterData,
          column,
          searchText,
          range
      })
  }
}
