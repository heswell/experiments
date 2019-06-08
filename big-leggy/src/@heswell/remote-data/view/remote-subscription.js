import {msgType as Msg} from '../constants';

// This is given to client on subscription and acts as a conduit between client and server
// client calls api methods directly, the view calls postMessageToClient when it receives
// responses from server. 
export default class RemoteSubscription {
  constructor(viewport, postMessageToServer, postMessageToClient){
      this.viewport = viewport;
      this.postMessageToServer = postMessageToServer;
      this.postMessageToClient = postMessageToClient;
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
