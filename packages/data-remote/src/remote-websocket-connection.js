
export default class Connection {

  static connect(connectionString, callback) {
    return new Promise(function (resolve) {
        const connection = new Connection(connectionString, msg => {
          const {type} = msg;
          // TODO check the connection status is actually connected
          if (type === 'connection-status'){
            resolve(connection)
          } else if (type === 'HB'){

          } else {
            callback(msg)
          }
        });
    });
  }

  constructor(connectionString, callback) {
      this._callback = callback;
      const ws = new WebSocket('ws://' + connectionString);
      ws.onopen = () => {
        console.log('%c⚡','font-size: 24px;color: green;font-weight: bold;');
          callback({type : 'connection-status',  status: 'connected' });
      };

      ws.onmessage = evt => {
        const message = JSON.parse(evt.data);
        // console.log(`%c<<< [${new Date().toISOString().slice(11,23)}]  (WebSocket) ${message.type || JSON.stringify(message)}`,'color:white;background-color:blue;font-weight:bold;');
        if (Array.isArray(message)){
          message.map(callback)
        } else {
          callback(message);
        }
      }

      ws.onerror = evt => websocketError(callback, evt);
      ws.onclose = evt => websocketClosed(callback, evt);
      this.ws = ws;
  }

  send(message) {
      // console.log(`%c>>>  (WebSocket) ${JSON.stringify(message)} bufferedAmount ${this.ws.bufferedAmount}`,'color:yellow;background-color:blue;font-weight:bold;');
      this.ws.send(JSON.stringify(message));
  }

}

function websocketError(callback) {
  callback({type:'websocket.websocketError'});
}

function websocketClosed(callback) {
  callback({type:'websocket.websocketClosed'});
}
