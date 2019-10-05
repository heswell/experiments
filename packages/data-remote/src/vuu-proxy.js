import Connection from './remote-websocket-connection';
import * as Message from './servers/vuu/messages';
import { ServerApiMessageTypes as API } from './messages.js';
import { createLogger, logColor } from './constants';

const logger = createLogger('ViewsServerProxy', logColor.blue);

const SORT = {
    asc: 'D',
    dsc : 'A'
}

function partition(array, test, pass = [], fail = []) {

    for (let i = 0, len = array.length; i < len; i++) {
        (test(array[i], i) ? pass : fail).push(array[i]);
    }

    return [pass, fail];
}

let _requestId = 1;

// we use one ServerProxy per client (i.e per browser instance)
// This is created as a singleton in the (remote-data) view
// TODO don'r we need to create one per server connected to ?
export class ServerProxy {

    constructor(clientCallback) {
        this.connection = null;
        this.connectionStatus = 'not-connected';

        this.queuedRequests = [];
        this.viewportStatus = {};
        this.loginToken = null;
        this.sessionId= null;
        this.pendingLogin = null;
        this.pendingAuthentication = null;
        this.pendingSubscriptionRequests = {};
        this.postMessageToClient = clientCallback;
        this.viewports = {
            serverToClient: {},
            clientToServer: {}
        }

    }

    handleMessageFromClient(message) {

        switch (message.type){
            case 'setViewRange':
                const isViewportReady = this.viewports.clientToServer[message.viewport] !== undefined;
                if (isViewportReady){
                    const vuuMessage = {
                        "requestId" : _requestId++,
                        "sessionId" : this.sessionId,
                        "token" : this.loginToken,
                        "user" : "user",
                        "body" : {
                          "type" : Message.CHANGE_VP_RANGE,
                          "viewPortId" : this.viewports.clientToServer[message.viewport],
                          "from" : message.range.lo,
                          "to" : message.range.hi
                        },
                        "module" : "CORE"
                    }
    
                    this.sendIfReady(vuuMessage);
    
                }
            
            case 'sort': {
                console.log(`sort ${JSON.stringify(message,null,2)}`);
                const vuuMessage = 
                    {
                        "requestId" : _requestId++,
                        "sessionId" : this.sessionId,
                        "token" : this.loginToken,
                        "user" : "user",
                        "body" : {
                          "type" : Message.CHANGE_VP,
                          "viewPortId" : this.viewports.clientToServer[message.viewport],
                          "columns" : [ "ric", "description", "currency", "exchange", "lotSize", "bid", "ask", "last", "open", "close", "scenario" ],
                          "sort" : {
                            sortDefs: message.sortCriteria.map(([column, dir='asc']) => ({column, sortType: SORT[dir]}))
                          },
                          "groupBy" : [ ],
                          "filterSpec" : null
                        },
                        "module" : "CORE"
                      }
                      this.sendIfReady(vuuMessage);
                }
                break;

            default:
                        console.log(`send message to server ${JSON.stringify(message)}`)

            }

    }

    sendIfReady(message, isReady=true) {
        // TODO implement the message queuing in remote data view
        if (isReady) {
            this.sendMessageToServer(message);
        } else {
            this.queuedRequests.push(message);
        }

        return isReady;

    }

    // if we're going to support multiple connections, we need to save them against connectionIs
    async connect({ connectionString, connectionId = 0 }) {

        logger.log(`<connect> connectionString: ${connectionString} connectionId: ${connectionId}`)
        this.connectionStatus = 'connecting';
        this.connection = await Connection.connect(connectionString, msg => this.handleMessageFromServer(msg));

        // login
        console.log(`connected to VUU, now we're going to authenticate ...`)
        const token = await this.authenticate('steve', 'steve');
        console.log(`authenticated on VUU token: ${token}, now we're going to login ...`)

        const sessionId = await this.login();
        console.log(`logged in to VUU sessionId: ${sessionId}`)

        this.onReady(connectionId);
    }

    async authenticate(username, password){
        return new Promise((resolve, reject) => {
            this.sendMessageToServer({
                requestId : "",
                sessionId : "",
                token : "",
                user : "",
                body : {
                  type : Message.AUTH,
                  username,
                  password
                },
                module : "CORE"            
            })
            this.pendingAuthentication = {resolve, reject}
        })
    }

    authenticated(token){
        this.loginToken = token;
        this.pendingAuthentication.resolve(token);
    }

    async login(){
        return new Promise((resolve, reject) => {
            this.sendMessageToServer({
                requestId : "",
                sessionId : "",
                token : "",
                user : "",
                body : {
                  type : Message.LOGIN,
                  token : this.loginToken,
                  user: "user"
                },
                module : "CORE"            
            })
            this.pendingLogin = {resolve, reject}
        })

    }

    loggedIn(sessionId){
        this.sessionId = sessionId;
        this.pendingLogin.resolve(sessionId);
    }

    subscribe(message) {
        const isReady = this.connectionStatus === 'ready';
        const {connectionId, viewport, tablename, columns, range: {lo, hi}} = message;
        this.pendingSubscriptionRequests[viewport] = message;
        this.viewportStatus[viewport] = 'subscribing';

        console.log(JSON.stringify(message,null,2))

        const vuuMessage = {
            requestId : viewport,
            sessionId : this.sessionId,
            token : this.loginToken,
            user : "user",
            body : {
                type : Message.CREATE_VP,
                table : tablename,
                range : {
                    from : lo,
                    to : hi
                },
                columns : columns.map(column => column.name),
                sort : {
                    sortDefs : [ ]
                },
                groupBy : [ ],
                filterSpec : {
                    filter : ""
                }
            },
            module : "CORE"
        }
     
        this.sendIfReady( vuuMessage, isReady);
    }

    subscribed(/* server message */ viewport, message) {
        const { viewPortId } = message;
        if (this.pendingSubscriptionRequests[viewport]) {
            const request = this.pendingSubscriptionRequests[viewport];
            // const {table, columns, sort, filter, groupBy} = request;
            let { range } = request;
            logger.log(`<handleMessageFromServer> SUBSCRIBED create subscription range ${range.lo} - ${range.hi}`)

            this.pendingSubscriptionRequests[viewport] = undefined;
            this.viewportStatus[viewport] = 'subscribed';
            // TODO roll this into the above
            this.viewports.serverToClient[viewPortId] = viewport;
            this.viewports.clientToServer[viewport] = viewPortId;

            const byViewport = vp => item => item.viewport === vp;
            const byMessageType = msg => msg.type === Message.SET_VIEWPORT_RANGE;
            const [messagesForThisViewport, messagesForOtherViewports] = partition(this.queuedRequests, byViewport(viewport));
            const [rangeMessages, otherMessages] = partition(messagesForThisViewport, byMessageType);

            this.queuedRequests = messagesForOtherViewports;
            rangeMessages.forEach(msg => {
                range = msg.range;
            });

            if (otherMessages.length) {
                console.log(`we have ${otherMessages.length} messages still to process`);
            }

        }

    }

    onReady(connectionId) {
        this.connectionStatus = 'ready';
        // messages which have no dependency on previous subscription
        logger.log(`%c onReady ${JSON.stringify(this.queuedRequests)}`, 'background-color: brown;color: cyan')

        const byReadyToSendStatus = msg => msg.viewport === undefined || msg.type === API.addSubscription;
        const [readyToSend, remainingMessages] = partition(this.queuedRequests, byReadyToSendStatus);
        // TODO roll setViewRange messages into subscribe messages
        readyToSend.forEach(msg => this.sendMessageToServer(msg));
        this.queuedRequests = remainingMessages;
        this.postMessageToClient({ type: 'connection-status', status: 'ready', connectionId });
    }

    sendMessageToServer(message) {
        // const { clientId } = this.connection;
        this.connection.send(message);
    }


    batchByViewport(rows){
        const viewports = {};
        for (let i=0; i < rows.length; i++){
            const {viewPortId, vpSize, rowIndex, rowKey, updateType, ts, data} = rows[i];
            if (updateType === Message.UPDATE){
                const record = (viewports[viewPortId] || (viewports[viewPortId] = {viewPortId, size: vpSize, rows: []}));
                data.push(rowIndex, 0, 0);
                record.rows.push(data);
            } else if (updateType === Message.SIZE){
                console.log(`size record ${JSON.stringify(rows[i],null,2)}`)
            }
        }
        return Object.values(viewports);
    }

    handleMessageFromServer(message) {
        if (!message.body){
            console.error('invalid message', message)
            return;
        } else if (message.body.type === 'HB'){
            this.sendMessageToServer({
                "requestId" : "NA",
                "sessionId" : this.sessionId,
                "token" : this.loginToken,
                "user" : "user",
                "body" : {
                  "type" : "HB_RESP",
                  "ts" : +(new Date())
                },
                "module" : "CORE"
            })
            return;
        }

        const {requestId, sessionId, token, body} = message; 

        switch (body.type) {
            case Message.AUTH_SUCCESS:
                return this.authenticated(token);
            case Message.LOGIN_SUCCESS:
                return this.loggedIn(sessionId);   
            case Message.CREATE_VP_SUCCESS:
                return this.subscribed(requestId, body);
            case Message.CHANGE_VP_RANGE_SUCCESS:
                console.log(`VP range changed`);
                break;
            case Message.TABLE_ROW: {
                const {batch, isLast, timestamp, rows} = body;
                const rowsByViewport = this.batchByViewport(rows);
                rowsByViewport.forEach(({viewPortId,size, rows}) => {
                    const output = {
                        viewport: this.viewports.serverToClient[viewPortId],
                        type: 'rowset',
                        data: {
                            size,
                            offset: 0,
                            range: {lo: 0, hi: 27},
                            rows
                        }
                    }
                    this.postMessageToClient(output);
                })                
            }

                break;
            // case Message.FILTER_DATA:
            // case Message.SEARCH_DATA:
            //     const { data: filterData } = message;
            //     // const { rowset: data } = subscription.putData(type, filterData);

            //     // if (data.length || filterData.size === 0) {
            //     this.postMessageToClient({
            //         type,
            //         viewport,
            //         [type]: filterData
            //     });
            //     // }

            //     break;

            default:
                this.postMessageToClient(message.body);

        }

    }

}

/*
message from server {
    "requestId": "NA",
    "sessionId": "a5f525ea-9083-4b71-bc3f-28ba5afe7135",
    "token": "",
    "user": "user",
    "body": {
      "type": "TABLE_ROW",
      "batch": "4b2ce98c-55a9-41e2-af88-69083ae742a0",
      "isLast": true,
      "timeStamp": 1569745722689,
      "rows": [
        {
          "viewPortId": "user-f4bb8898-f4e5-4e41-b824-53a4a19e40c5",
          "vpSize": 0,
          "rowIndex": -1,
          "rowKey": "SIZE",
          "updateType": "SIZE",
          "ts": 1569745722689,
          "data": []
        }
      ]
    },
    "module": "CORE"
  }

  message from server {
    "requestId": "NA",
    "sessionId": "a5f525ea-9083-4b71-bc3f-28ba5afe7135",
    "token": "",
    "user": "user",
    "body": {
      "type": "TABLE_ROW",
      "batch": "f1e0d7ad-2ea9-494d-9008-7f09699ee4ed",
      "isLast": true,
      "timeStamp": 1569745722793,
      "rows": [
        {
          "viewPortId": "user-f4bb8898-f4e5-4e41-b824-53a4a19e40c5",
          "vpSize": 53767,
          "rowIndex": 0,
          "rowKey": "AAA.L",
          "updateType": "U",
          "ts": 1569745722785,
          "data": [
            "AAA.L",
            "AAA.L London PLC",
            "USD",
            "XLON/LSE-SETS",
            633,
            694,
            700.94,
            "",
            "",
            "",
            "walkBidAsk"
          ]
        },
        {
          "viewPortId": "user-f4bb8898-f4e5-4e41-b824-53a4a19e40c5",
          "vpSize": 53767,
          "rowIndex": 1,
          "rowKey": "AAA.N",
          "updateType": "U",
          "ts": 1569745722785,
          "data": [
            "AAA.N",
            "AAA.N Corporation",
            "EUR",
            "XNGS/NAS-GSM",
            220,
            109,
            139,
            "",
            "",
            "",
            "fastTick"
          ]
        },
        {
          "viewPortId": "user-f4bb8898-f4e5-4e41-b824-53a4a19e40c5",
          "vpSize": 53767,
          "rowIndex": 2,
          "rowKey": "AAA.OQ",
          "updateType": "U",
          "ts": 1569745722786,
          "data": [
            "AAA.OQ",
            "AAA.OQ Co.",
            "EUR",
            "XNYS/NYS-MAIN",
            393,
            86,
            86,
            "",
            "",
            "",
            "walkBidAsk"
          ]
        },

        ...

        message from server {
            "requestId": "NA",
            "sessionId": "a5f525ea-9083-4b71-bc3f-28ba5afe7135",
            "token": "",
            "user": "user",
            "body": {
              "type": "TABLE_ROW",
              "batch": "c6683531-5ffb-48b1-8b08-2b05c4481c5b",
              "isLast": true,
              "timeStamp": 1569745723293,
              "rows": [
                {
                  "viewPortId": "user-f4bb8898-f4e5-4e41-b824-53a4a19e40c5",
                  "vpSize": 53767,
                  "rowIndex": 10,
                  "rowKey": "AAC.OQ",
                  "updateType": "U",
                  "ts": 1569745723293,
                  "data": [
                    "AAC.OQ",
                    "AAC.OQ Co.",
                    "GBX",
                    "XNYS/NYS-MAIN",
                    559,
                    830,
                    838.3,
                    "",
                    "",
                    "",
                    "fastTick"
                  ]
                }
              ]
            },
            "module": "CORE"
          }
          */