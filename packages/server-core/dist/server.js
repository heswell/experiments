import { configure as configureRequestHandlers } from "./requestHandlers.js";
import { configure as configureXhr } from "./xhrHandler.js";
import { requestHandler as viewserverRequestHandler } from "./handlers/viewserverRequestHandler.js";
import { handleAuthenticationRequest } from "./handlers/authenticationHandler.js";
import serveStatic from "serve-static";
import http from "http";
import WebSocket from "ws";
const logger = console;
class SubscriptionCounter {
  constructor() {
    this._count = 0;
  }
  next() {
    this._count += 1;
    return this._count;
  }
}
const port = 8090;
const PRIORITY_UPDATE_FREQUENCY = 20;
const CLIENT_UPDATE_FREQUENCY = 50;
const HEARTBEAT_FREQUENCY = 5e3;
function start(config) {
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
  var serve = serveStatic("/Users/steve/git/venuu-io/vuu/vuu-ui/packages/app-vuu-example/public", {
    index: ["index.html"]
  });
  const httpServer = http.createServer(function(request, response) {
    console.log(`req ${request.url}`);
    if (request.url.match(/login|index|chunk|worker|favicon/)) {
      serve(request, response, (req, res) => {
        console.log(`what do we do now`, {
          req
        });
      });
    } else if (request.url === "/xhr") {
      handleXhrRequest(request, response);
    } else if (request.url === "/api/authn") {
      handleAuthenticationRequest(request, response);
    } else if (request.url.match(/\/ws\/info/)) {
      const HTTP_HEADERS = {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": request.headers["origin"],
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Content-type": "application/json;charset=UTF-8"
      };
      response.writeHead(200, HTTP_HEADERS);
      response.end(
        JSON.stringify({ entropy: 9006110, origins: ["*:*"], cookie_needed: true, websocket: true })
      );
    } else {
      console.log(new Date() + " received request for " + request.url);
      request.addListener("end", function() {
      }).resume();
    }
  });
  const wss = new WebSocket.Server({ server: httpServer });
  const requestHandler = viewserverRequestHandler;
  wss.on("connection", requestHandler(msgConfig, logger));
  httpServer.listen(port, function() {
    console.log(`HTTP Server is listening on port ${port}`);
  });
}
function handleXhrRequest(request, response) {
  let content = "";
  request.on("data", (data) => content += data);
  request.on("end", () => {
    console.log(`got a client request ${content}`);
    let { clientId, message } = JSON.parse(content);
  });
}
export {
  start
};
//# sourceMappingURL=server.js.map
