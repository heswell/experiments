import {configure as configureRequestHandlers} from './requestHandlers';
import {configure as configureXhr} from './xhrHandler';
import {requestHandler as viewserverRequestHandler} from './handlers/viewserverRequestHandler';

import http from 'http';
import WebSocket from 'ws';

const logger = console

class SubscriptionCounter {
    constructor(){
        this._count = 0;
    }
    next(){
        this._count += 1;
        return this._count;
    }
}

//const mapArgs = (map, arg) => {let [n,v]=arg.split('=');map[n.toLowerCase()]=v;return map;};
// const args = process.argv.slice(2).reduce(mapArgs,{});
const port = /* argv.port || */ 9090;

//onsole.log(`args ${JSON.stringify(process.argv)}`);

//const port = process.env.OPENSHIFT_NODEJS_PORT || argv.port || 9090;
const PRIORITY_UPDATE_FREQUENCY = 20;
const CLIENT_UPDATE_FREQUENCY = 50;
const HEARTBEAT_FREQUENCY = 5000;

export default function start(config){

    configureRequestHandlers({
        ...config,
        subscriptionCounter: new SubscriptionCounter()
    });

    const msgConfig = {
        CLIENT_UPDATE_FREQUENCY,
        HEARTBEAT_FREQUENCY,
        PRIORITY_UPDATE_FREQUENCY
    };

    configureXhr(msgConfig);

    const httpServer = http.createServer(function(request, response) {
        
        if (request.url === '/xhr'){
            handleXhrRequest(request, response);
        } else {
            console.log((new Date()) + ' received request for ' + request.url);
            request.addListener('end', function () {
                // do nothing
            }).resume();
        }
    });

    const wss = new WebSocket.Server({server: httpServer});

    const requestHandler = viewserverRequestHandler;

    wss.on('connection', requestHandler(msgConfig, logger));

    // const ipaddress = '127.0.0.1';
    httpServer.listen(port, function() {
        console.log(`HTTP Server is listening on port ${port}`);
    });
};

function handleXhrRequest(request, response){
    let content = '';
    request.on('data', data => content += data);
    request.on('end', () => {
        console.log(`got a client request ${content}`);
        let {clientId,message} = JSON.parse(content);
    });
}