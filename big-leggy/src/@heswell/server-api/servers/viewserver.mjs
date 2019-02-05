import {
    TABLE_LIST,
    COLUMN_LIST,
    SUBSCRIBE,
    SUBSCRIBED,
    MODIFY_SUBSCRIPTION,
    // UNSUBSCRIBE,
    SET_VIEWPORT_RANGE,
    VIEWPORT_RANGE_CHANGED,
    EXPAND_GROUP,
    COLLAPSE_GROUP,
    DATA
} from '../messages';

const HEART = String.fromCharCode(9829);

const WELCOME = 'Welcome';
const NOT_WELCOME = 'Not Welcome';
const GET_TABLE_LIST = 'GetTableList';
const GET_TABLE_META = 'GetTableMeta';
const GET_FILTER_DATA = 'GetFilterData';
const HEARTBEAT = 'HB_RESP';
const TABLE_LIST_RESP = 'table-list';
const TABLE_META_RESP = 'column-list';
const CHANGE_VP_RANGE_SUCCESS = 'rangeChanged';
const ROWSET = 'rowset';
const UPDATE = 'update';
const INSERT = 'insert';
const FILTER_DATA = 'filterData';
const SEARCH_DATA = 'searchData';
// const DELETE = 'delete';
// const SIZE = 'size';

export default class ViewServer {

    constructor(){
        this.name = 'ViewServer';

        this.customMessageTypes = {
            [WELCOME]: true,
            [NOT_WELCOME]: true
        };

        this.messageHandlers = {
            HB: (connection, message) => {
                // console.log(`%c${HEART}`, 'color:red;font-weight:bold;font-size:20px');
                //onnection.send({type:HEARTBEAT});
            }
        };

        this.connectionPipeline = [receiveWelcome];
    }

    serialize(msg, clientId, requestId) {

        const message = this.body(requestId, msg);

        return message ? { clientId, message } : null;

    }

    body(requestId, message) {

        const { viewport, type } = message;

        switch (type) {

            case HEARTBEAT: return { type, ts: new Date().getTime() };

            case TABLE_LIST: return { requestId, type: GET_TABLE_LIST };

            case COLUMN_LIST: return { requestId, type: GET_TABLE_META, table: message.params.table };

            case MODIFY_SUBSCRIPTION:
            case SUBSCRIBE:
                //onsole.log(`subscribe ${JSON.stringify(message)}`);
                // there is no need to require the tablename
                const { tablename, columns, sortBy, filter, groupBy, groupState, range } = message;

                return {
                    requestId,
                    viewport,
                    type,
                    tablename,
                    range,
                    columns/* : columns && columns.map(col => typeof col === 'string' ? col : col.name)*/,
                    sortBy,
                    filter,
                    groupBy,
                    groupState
                };

            case SET_VIEWPORT_RANGE:

                return { requestId, type, viewport, range: message.range, dataType: message.dataType };

            case EXPAND_GROUP:

                return { requestId, type, viewport, groupKey: message.groupKey, groupState: message.groupState };

            case COLLAPSE_GROUP:

                return { requestId, type, viewport, groupKey: message.groupKey, groupState: message.groupState };

            default: return message;

        }
    }

    deserialize(message) {
        const { type, viewport, requestId } = message;

        switch (type) {

            case TABLE_LIST_RESP: return message;

            case TABLE_META_RESP:
                const { table, columns, dataTypes, key } = message;
                return {
                    type: 'column-list',
                    requestId,
                    table,
                    columns: columns.map(col => typeof col === 'object' ? col : { name: col }),
                    dataTypes,
                    key
                };

            case SUBSCRIBED:

                const { size = 0, offset } = message;

                return { type, requestId, viewport, size, offset };

            case CHANGE_VP_RANGE_SUCCESS:

                //onsole.log(`VP CHANGED ${JSON.stringify(message)}`)

                return {
                    type: VIEWPORT_RANGE_CHANGED,
                    requestId,
                    viewport,
                    range: message.range
                };

            case ROWSET:

                // onsole.groupCollapsed(`rowset ${message.rows.length} rows size ${message.size} offset ${message.offset}`)
                // onsole.log(JSON.stringify(message.rows))
                // onsole.groupEnd()

                return {
                    type: DATA,
                    data: [{
                        viewport,
                        rows: message.data.rows,
                        size: message.data.size,
                        offset: message.data.offset
                    }]
                };

            case UPDATE:
                // onsole.groupCollapsed(`update ${message.rows.length} rows`)
                // onsole.log(JSON.stringify(message.updates))
                // onsole.groupEnd()
                return {
                    type: DATA,
                    data: [{
                        viewport,
                        updates: message.updates
                    }]
                };

            case FILTER_DATA:

                return {
                    type,
                    viewport,
                    ts: message.ts,
                    columnName: message.columnName,
                    filterData: message.data
                };

            case SEARCH_DATA:

                return {
                    type,
                    viewport,
                    columnName: message.columnName,
                    filterData: message.data
                };

            case INSERT:
                // onsole.groupCollapsed(`insert ${message.rows.length} rows of ${message.size}`)
                // onsole.log(JSON.stringify(message.rows))
                // onsole.groupEnd()
                return {
                    type: DATA,
                    data: [{
                        viewport,
                        size: message.size,
                        rows: message.rows,
                        offset: message.offset
                    }]
                };

            case GET_FILTER_DATA:
                return { type };

            default:
                return message;
        }
    }
}

function receiveWelcome(connection) {
    return new Promise(function (resolve, reject) {
        console.log(`[viewserver] receiveWelcome, register for Welcome message`)
        connection.once(WELCOME, (evtName, msg) => {
            connection.clientId = msg.clientId;
            resolve(connection);
        });

        connection.once('NOT_WELCOME', msg => reject({ connection, msg }));

    });

}



