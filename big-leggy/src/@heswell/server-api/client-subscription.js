// import uuid from '../server-core/uuid';
import * as Message from './messages.js';
import { DataTypes } from '../data/store/types';
import { getWorker } from './worker';

// const clientId = uuid();

async function postMessage(message){
  const worker = await getWorker();
  worker.postMessage(message);
}

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
      postMessage({
          // clientId,
          viewport: this.id,
          type: Message.SET_VIEWPORT_RANGE,
          range: {lo,hi},
          dataType
      })
  }

  groupBy(columns){
      postMessage({
          viewport: this.id,
          type: Message.GROUP_BY,
          groupBy: columns
      })
  }

  setGroupState(groupState){
      postMessage({
          viewport: this.id,
          type: Message.SET_GROUP_STATE,
          groupState
      })
  }

  sort(columns){
      postMessage({
          viewport: this.id,
          type: Message.SORT,
          sortCriteria: columns
      })
  }

  filter(filter, dataType=DataTypes.ROW_DATA){
      postMessage({
          viewport: this.id,
          type: Message.FILTER,
          dataType,
          filter
      })
  }

  getFilterData(column, searchText, range){
      postMessage({
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
