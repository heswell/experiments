import {EventEmitter} from './eventEmitter.mjs';
import WebSocket from 'ws';

const WORKER_LOG = 'color:navy;background-color:lime;font-weight:bold;';
function log(text) {
    console.log(`%c${text}`, WORKER_LOG);
}

export function connect(connectionString) {

    return new Promise(function (resolve, reject) {

        const transport = new Connection(connectionString);

        transport.on('connection-status', (eventName, {status}) => {

            if (status === 'connected') {
                console.log('Websocket.connected');
                resolve(transport);
            }

        });
    });
}

class Connection extends EventEmitter {

    constructor(connectionString) {

        super();

        log('open Websocket on ' + connectionString);
        const ws = new WebSocket('ws://' + connectionString);

        ws.on('open', evt => this.emit('connection-status', { status: 'connected' }));
        ws.on('message', message => this.emit('message', JSON.parse(message)));
        ws.on('close', evt => log('websocket.websocketClosed'));

        // ws.onerror = evt => websocketError(this, evt);

        this.ws = ws;

    }

    //TODO should we separate the message type from the message itself ?
    send(message) {
        // console.log(`%c>>>  (WebSocket) ${JSON.stringify(message)} bufferedAmount ${this.ws.bufferedAmount}`,'color:yellow;background-color:blue;font-weight:bold;');
        this.ws.send(JSON.stringify(message));
    }

}
