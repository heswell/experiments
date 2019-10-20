import * as Message from './messages';
import { ServerApiMessageTypes as API } from '../../messages.js';
import { createLogger, logColor, partition } from '@heswell/utils';

const logger = createLogger('ViewsServerProxy', logColor.blue);

const SORT = { asc: 'D', dsc : 'A' };

let _requestId = 1;









export class ServerProxy {

    constructor(connection) {
        this.connection = connection;
        this.queuedRequests = [];
        this.viewportStatus = {};

        this.queuedRequests = [];
        this.loginToken = "";
        this.sessionId= "";
        this.pendingLogin = null;
        this.pendingAuthentication = null;

    }

    handleMessageFromClient(message) {

        const viewport = this.viewportStatus[message.viewport];
        const isReady = viewport.status === 'subscribed';

        switch (message.type){
            case 'setViewRange':
                this.sendIfReady({
                    type : Message.CHANGE_VP_RANGE,
                    viewPortId : viewport.serverId,
                    from : message.range.lo,
                    to : message.range.hi
                },
                _requestId++,
                isReady)
                break;
            case 'groupBy':
                this.sendIfReady({
                    type : Message.CHANGE_VP,
                    viewPortId : viewport.serverId,
                    columns : [ "ric", "description", "currency", "exchange", "lotSize", "bid", "ask", "last", "open", "close", "scenario" ],
                    sort : {
                        sortDefs: []
                    },
                    groupBy : message.groupBy.map(([columnName]) => columnName),
                    filterSpec : null
                },
                _requestId++,
                isReady)
                break;
                
            case 'sort':
                this.sendIfReady({
                    type : Message.CHANGE_VP,
                    viewPortId : viewport.serverId,
                    columns : [ "ric", "description", "currency", "exchange", "lotSize", "bid", "ask", "last", "open", "close", "scenario" ],
                    sort : {
                        sortDefs: message.sortCriteria.map(([column, dir='asc']) => ({column, sortType: SORT[dir]}))
                    },
                    groupBy : [ ],
                    filterSpec : null
                },
                _requestId++,
                isReady)
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

    disconnected(){
        logger.log(`disconnected`);
        for (let [viewport, {callback}] of Object.entries(this.viewportStatus)) {
            callback({
                rows: [],
                size: 0,
                range: {lo:0, hi:0}
            })
        }
    }

    resubscribeAll(){
        logger.log(`resubscribe all`)
        // for (let [viewport, {request}] of Object.entries(this.viewportStatus)) {
        //     this.sendMessageToServer({
        //         type: API.addSubscription,
        //         ...request
        //     });
        // }
    }

    async authenticate(username, password){
        return new Promise((resolve, reject) => {
            this.sendMessageToServer({type : Message.AUTH, username, password}, "");
            this.pendingAuthentication = {resolve, reject}
        })
    }

    authenticated(token){
        this.loginToken = token;
        this.pendingAuthentication.resolve(token);
    }

    async login(){
        return new Promise((resolve, reject) => {
            this.sendMessageToServer({type : Message.LOGIN}, "");
            this.pendingLogin = {resolve, reject}
        })
    }

    loggedIn(sessionId){
        this.sessionId = sessionId;
        this.pendingLogin.resolve(sessionId);
    }

    subscribe(message, callback) {
        // the session should live at the connection level
        const isReady = this.sessionId !== "";
        const {viewport, tablename, columns, range: {lo, hi}} = message;
        this.viewportStatus[viewport] = {
            status: 'subscribing',
            request: message,
            callback
        }

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

    subscribed(/* server message */ clientViewport, message) {
        const viewport = this.viewportStatus[clientViewport];
        const { viewPortId } = message;

        if (viewport) {
            // key the viewport on server viewport ID as well as client id
            this.viewportStatus[viewPortId] = viewport;

            viewport.status = 'subscribed';
            viewport.serverId = viewPortId;

            const {table, range, columns, sort, groupBy, filterSpec} = message;
            viewport.spec = {
                table, range, columns, sort, groupBy, filterSpec
            };

            const byViewport = vp => item => item.viewport === vp;
            const byMessageType = msg => msg.type === Message.CHANGE_VP;
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
            case Message.CHANGE_VP_SUCCESS:
                break;
            case Message.TABLE_ROW: {
                const {batch, isLast, timestamp, rows} = body;
                const rowsByViewport = this.batchByViewport(rows);
                rowsByViewport.forEach(({viewPortId,size, rows}) => {
                    const {request: {viewport}, callback: postMessageToClient} = this.viewportStatus[viewPortId];
                    const output = {
                        size,
                        offset: 0,
                        range: {lo: 0, hi: 27},
                        rows
                    }
                    postMessageToClient(output);
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