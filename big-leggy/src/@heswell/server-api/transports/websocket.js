/* global WebSocket */
import {EventEmitter} from './eventEmitter.mjs';

export function connect(connectionString) {
    console.log(`[WebSocket.connect]`)
    return new Promise(function (resolve, reject) {

        const transport = new Connection(connectionString);

        transport.on('connection-status', (eventName, {status}) => {

            if (status === 'connected') {
                console.log('%c⚡','font-size: 24px;color: green;font-weight: bold;');
                resolve(transport);
            }

        });
    });
}

class Connection extends EventEmitter {

    constructor(connectionString) {

        super();

        const ws = new WebSocket('ws://' + connectionString);

        ws.onopen = evt => {
            console.log(`websocket connected`)
            this.emit('connection-status', { status: 'connected' });
        };

        ws.onmessage = evt => websocketMessage(this, evt);

        ws.onerror = evt => websocketError(this, evt);

        ws.onclose = evt => websocketClosed(this, evt);

        this.ws = ws;

    }

    //TODO should we separate the message type from the message itself ?
    send(message) {
        // console.log(`%c>>>  (WebSocket) ${JSON.stringify(message)} bufferedAmount ${this.ws.bufferedAmount}`,'color:yellow;background-color:blue;font-weight:bold;');
        this.ws.send(JSON.stringify(message));
    }

}

// Websocket event handlers

function websocketMessage(connection, evt) {
    const message = JSON.parse(evt.data);
    // console.log(`%c<<< [${new Date().toISOString().slice(11,23)}]  (WebSocket) ${message.type || JSON.stringify(message)}`,'color:white;background-color:blue;font-weight:bold;');
    connection.emit('message', message);
}

function websocketError(connection, evt) {
    console.log('websocket.websocketError');
}

function websocketClosed(connection, evt) {
    console.log('websocket.websocketClosed');
}
