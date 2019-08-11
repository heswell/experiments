
import {ServerProxy} from '../worker-hosted/serverProxy.mjs';

export default class WebWorker {

    //TODO allow connectionString to be passed in constructor
    constructor() {
        console.log(`WebWorker.constructor`)
        this._server = new ServerProxy(message => this._onmessage(message));
    }

    postMessage(message){
        this._server.handleMessageFromClient(message);
    }

    _onmessage(message){
        console.log(`message received from worker, no client is listening ${JSON.stringify(message)}`);
    }

    set onmessage(handler) {
        this._onmessage = handler;
    }

    terminate(){
        console.log(`terminate worker`);
    }

}

console.log(`>>>> The webworker script has loded`);
 