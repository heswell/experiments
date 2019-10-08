import Connection from '../../remote-websocket-connection';
import * as Message from './messages';
import { ServerApiMessageTypes as API } from '../../messages.js';
import { createLogger, logColor } from '../../constants';

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
        this.loginToken = "";
        this.sessionId= "";
        this.pendingLogin = null;
        this.pendingAuthentication = null;
        this.pendingSubscriptionRequests = {};
        this.postMessageToClient = clientCallback;
        this.viewports = {};

    }

    handleMessageFromClient(message) {

        const viewport = this.viewports[message.viewport];

        switch (message.type){
            case 'setViewRange':
                const isViewportReady = viewport !== undefined;
                if (isViewportReady){
                    this.sendIfReady({
                        type : Message.CHANGE_VP_RANGE,
                        viewPortId : viewport.serverId,
                        from : message.range.lo,
                        to : message.range.hi
                    })
                }
                break;
            case 'groupBy': {
                console.log(message.groupBy)
                this.sendIfReady({
                    type : Message.CHANGE_VP,
                    viewPortId : viewport.serverId,
                    columns : [ "ric", "description", "currency", "exchange", "lotSize", "bid", "ask", "last", "open", "close", "scenario" ],
                    sort : {
                        sortDefs: []
                    },
                    groupBy : message.groupBy.map(([columnName]) => columnName),
                    filterSpec : null
                  });
            }
                break;
                
            case 'sort': {
                this.sendIfReady({
                        type : Message.CHANGE_VP,
                        viewPortId : viewport.serverId,
                        columns : [ "ric", "description", "currency", "exchange", "lotSize", "bid", "ask", "last", "open", "close", "scenario" ],
                        sort : {
                            sortDefs: message.sortCriteria.map(([column, dir='asc']) => ({column, sortType: SORT[dir]}))
                        },
                        groupBy : [ ],
                        filterSpec : null
                      });
                }
                break;

            default:
                console.log(`send message to server ${JSON.stringify(message)}`)

            }

    }

    sendMessageToServer(body, requestId=_requestId++) {
        // const { clientId } = this.connection;
        this.connection.send({
            requestId,
            sessionId : this.sessionId,
            token : this.loginToken,
            user : "user",
            module : "CORE",
            body
        });
    }

    sendIfReady(message, requestId, isReady=true) {
        // TODO implement the message queuing in remote data view
        if (isReady) {
            this.sendMessageToServer(message, requestId);
        } else {
            // TODO need to make sure we keep the requestId
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
            this.sendMessageToServer({type : Message.AUTH,username,password}, "");
            this.pendingAuthentication = {resolve, reject}
        })
    }

    authenticated(token){
        this.loginToken = token;
        this.pendingAuthentication.resolve(token);
    }

    async login(){
        return new Promise((resolve, reject) => {
            this.sendMessageToServer({type : Message.LOGIN},"");
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
        this.viewports[viewport] = {
            clientId: viewport,
            status: 'subscribing'
        };

        console.log(JSON.stringify(message,null,2))

        // use client side viewport as request id, so that when we process the response,
        // with the serverside viewport we can establish a mapping between the two
        this.sendIfReady({
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
        }, viewport, isReady)
     
    }

    subscribed(/* server message */ viewport, message) {
        const { viewPortId } = message;
        if (this.pendingSubscriptionRequests[viewport]) {
            const request = this.pendingSubscriptionRequests[viewport];

            this.pendingSubscriptionRequests[viewport] = undefined;
            // use server id as an alternate key to viewport
            const vp = this.viewports[viewPortId] = this.viewports[viewport];
            vp.status = 'subscribed';
            vp.serverId = viewPortId;
            const {table, range, columns, sort, groupBy, filterSpec} = message;
            vp.spec = {
                table, range, columns, sort, groupBy, filterSpec
            };

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


    batchByViewport(rows){
        const viewports = {};
        for (let i=0; i < rows.length; i++){
            const {viewPortId, vpSize, rowIndex, rowKey, updateType, ts, data} = rows[i];
            if (updateType === Message.UPDATE){
                const record = (viewports[viewPortId] || (viewports[viewPortId] = {viewPortId, size: vpSize, rows: []}));
                // TODO populate the key field correctly
                data.push(rowIndex, 0, 0, 0, data[0]);
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
        } else if (message.body.type === Message.HB){
            this.sendMessageToServer({type : Message.HB_RESP, ts : +(new Date())},"NA");
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
            case Message.CHANGE_VP_SUCCESS:
                console.log(`VP changed`);
                break;
            case Message.TABLE_ROW: {
                const {batch, isLast, timestamp, rows} = body;
                const rowsByViewport = this.batchByViewport(rows);
                rowsByViewport.forEach(({viewPortId,size, rows}) => {
                    const output = {
                        viewport: this.viewports[viewPortId].clientId,
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