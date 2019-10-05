// import uuid from '../server-core/uuid';
import * as Message from '../messages.js';
import { DataTypes } from '../../data/store/types';
import { postMessageToWorker } from './worker';

export default class ClientSubscription {
  constructor(connectionId, subscriptionId){
      this.connectionId = connectionId;
      this.id = subscriptionId;
  }

  _onData(message){
      console.log(`Subscription ${this.id} received ${message.type} but no client listening`);
  }

  set onData(callback){
      this._onData = callback;
  }

  get onData(){
      return this._onData;
  }

  setRange(lo, hi, dataType=DataTypes.ROW_DATA){
    postMessageToWorker({
          // clientId,
          viewport: this.id,
          type: Message.SET_VIEWPORT_RANGE,
          range: {lo,hi},
          dataType
      })
  }

  groupBy(columns){
    postMessageToWorker({
          viewport: this.id,
          type: Message.GROUP_BY,
          groupBy: columns
      })
  }

  setGroupState(groupState){
    postMessageToWorker({
          viewport: this.id,
          type: Message.SET_GROUP_STATE,
          groupState
      })
  }

  sort(columns){
    postMessageToWorker({
          viewport: this.id,
          type: Message.SORT,
          sortCriteria: columns
      })
  }

  filter(filter, dataType=DataTypes.ROW_DATA){
    postMessageToWorker({
          viewport: this.id,
          type: Message.FILTER,
          dataType,
          filter
      })
  }

  getFilterData(column, searchText, range){
    postMessageToWorker({
          viewport: this.id,
          type: Message.GET_FILTER_DATA,
          column,
          searchText,
          range
      })
  }

  toString(){
      return `I'm a subscription  #${this.id} on #${this.connectionId}`;
  }
}
