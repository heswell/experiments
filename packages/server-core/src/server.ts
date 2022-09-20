import serveStatic from 'serve-static';
import { handleAuthenticationRequest } from './handlers/authenticationHandler.js';
import { websocketConnectionHandler } from './handlers/websocketConnectionHandler.js';
import { configure as configureRequestHandlers } from './requestHandlers.js';
import { ServerConfig } from './serverTypes.js';

import http, { IncomingMessage, ServerResponse } from 'http';
import WebSocket from 'ws';

//const mapArgs = (map, arg) => {let [n,v]=arg.split('=');map[n.toLowerCase()]=v;return map;};
// const args = process.argv.slice(2).reduce(mapArgs,{});
const port = /* argv.port || */ 8090;

//onsole.log(`args ${JSON.stringify(process.argv)}`);

//const port = process.env.OPENSHIFT_NODEJS_PORT || argv.port || 9090;
const PRIORITY_UPDATE_FREQUENCY = 20;
const CLIENT_UPDATE_FREQUENCY = 50;
const HEARTBEAT_FREQUENCY = 5000;

export function start(config: ServerConfig) {
  configureRequestHandlers({
    ...config
  });

  const msgConfig = {
    CLIENT_UPDATE_FREQUENCY,
    HEARTBEAT_FREQUENCY,
    PRIORITY_UPDATE_FREQUENCY
  };

  var serve = serveStatic(`/Users/steve/github/venuu-io/vuu/vuu-ui/deployed_apps/app-vuu-example`, {
    index: ['index.html']
  });

  const httpServer = http.createServer(function (request, response) {
    console.log(`req ${request.url}`);
    if (request.url?.match(/login|index|chunk|worker|favicon|manifest/)) {
      serve(request, response, () => {
        console.log(`handled by serve-static`);
      });
    } else if (request.url === '/xhr') {
      handleXhrRequest(request, response);
    } else if (request.url === '/api/authn') {
      handleAuthenticationRequest(request, response);
    } else {
      console.log(new Date() + ' received request for ' + request.url);
      request
        .addListener('end', function () {
          // do nothing
        })
        .resume();
    }
  });

  const wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', websocketConnectionHandler(msgConfig));

  // const ipaddress = '127.0.0.1';
  httpServer.listen(port, function () {
    console.log(`HTTP Server is listening on port ${port}`);
  });
}

function handleXhrRequest(request: IncomingMessage, response: ServerResponse) {
  let content = '';
  request.on('data', (data: string) => (content += data));
  request.on('end', () => {
    console.log(`got a client request ${content}`);
    let { clientId, message } = JSON.parse(content);
  });
}
