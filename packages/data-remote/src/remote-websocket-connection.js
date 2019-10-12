
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

      ws.onerror = evt => {
        console.error(`websocket error`, evt)
        callback({type: 'connection-status', status: 'disconnected', reason: 'error'});
      }
      ws.onclose = evt => {
        console.warn(`websocket closed`, evt)
        callback({type: 'connection-status', status: 'disconnected', reason: 'close'});
      }
      this.send = message => ws.send(JSON.stringify(message))
  }
}