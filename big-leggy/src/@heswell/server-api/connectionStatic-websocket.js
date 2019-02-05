
import {EventEmitter} from './transports/eventEmitter.mjs';
import { connect } from './transports/websocket';

let connection;
let _requestSeq = 0;

export default class Connection extends EventEmitter {

    static connect(connectionString, userid=null, password=null) {
        console.log(`[connectionStatic.connect]`)
        return connection || (connection = new Promise(
            function (resolve, reject) {
                connect(connectionString)
                    .then(transport => new Connection(transport))
                    .then(resolve);
            }
        ));
    }

    constructor(transport) {

        super();

        this.transport = transport;

        transport.on('message', (evtName, message) => {
            if (Array.isArray(message)) {
                message.forEach(message => this.publishMessage(message));
            } else {
                this.publishMessage(message);
            }

        });
    }

    publishMessage(message){
        this.emit('message', message);
    }

    // send message to server
    send(message){
        this.transport.send(message);
    }

    // we could also allow server to provide it
    nextRequestId() {
        _requestSeq += 1;
        return 'REQ' + _requestSeq;
    }

}
