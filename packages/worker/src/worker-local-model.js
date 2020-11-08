// @ts-nocheck

import { DataStore, WorkerTable } from "@heswell/data-store";
import {DataTypes, EventEmitter} from '@heswell/utils';
import Range from './async-range'

const url = new URL(self.location);
const tableUrl = url.hash ? url.hash.slice(2) : '';  
console.log(`table config url ${tableUrl}`)
const loadTableConfiguration = async () => await import(/* webpackIgnore: true */ tableUrl);

let table;
let dataStore;

loadTableConfiguration().then(async ({config}) => {
    const {generateData} = await import(/* webpackIgnore: true */ config.dataUrl);
    table = new WorkerTable(config);
    table.setData(generateData());
    dataStore = new DataStore(table, {columns: config.columns}, new UpdateQueue);
    registerMessageHandlers();
    postMessage({type: 'ready'})
})
.catch(err => console.error(err));

// update these to change the stress test parameters
var STRESS_TEST_MESSAGE_COUNT = 1000;
var STRESS_TEST_UPDATES_PER_MESSAGE = 100;

// update these to change the
var LOAD_TEST_UPDATES_PER_MESSAGE = 100;
var LOAD_TEST_MILLISECONDS_BETWEEN_MESSAGES = 100;

class UpdateQueue extends EventEmitter {
    
    // just until we get typings sorted ...
    constructor(){
        super();
        this._queue = null;
        this.length = 0;
    }
    // not the right name
    update(updates, dataType = DataTypes.ROW_DATA) {
        if (updates.length === 0){
            debugger;
        }
        postMessage({dataType, updates});
    }

    // just until we get the typing sorted
    getCurrentBatch(){

    }

    resize(size) {
        console.log(`localUpdateQueue resize ${JSON.stringify(size)}`)
    }

    append(row, offset) {
        console.log(`localUpdateQueue append ${JSON.stringify(row)} offset ${offset}`)
    }

    replace(message) {
        console.log(`localUpdateQueue replace ${JSON.stringify(size)}`)
        // this.emit(DataTypes.ROW_DATA, message)
    }

    popAll() {
        console.log(`localUpdateQueue popAll`)
        return undefined; // for typescript, until we sort types for UpdateQueue
    }
}

var latestTestNumber = 0;


// TODO we can only use this is we accumulate data here in the worker, else we're throwing away data
let renderInterval = 50;

const generateBulkUpdates = (table, updateCount) => {
    const {columnMap,rows, valueColumns} = table;
    const updates = [];
    const rowCount = rows.length;
    if (rowCount > 0){
        for (let k = 0; k<updateCount; k++) {
            const idx = Math.floor(Math.random()*rowCount);
            const field = valueColumns[Math.floor(Math.random() * valueColumns.length)];
            const colIdx = columnMap[field];
            updates.push([idx, colIdx, Math.floor(Math.random()*100000)]);
        }
        return updates;
    }
}

let loadTestRunning = false;
function sendMessagesWithThrottle() {
    var messageCount = null;

    postMessage({
        type: 'test-started',
        messageCount: messageCount,
        updateCount: LOAD_TEST_UPDATES_PER_MESSAGE,
        interval: LOAD_TEST_MILLISECONDS_BETWEEN_MESSAGES
    });

    var intervalId;
    const {_table: table} = dataStore;

    function intervalFunc() {

        const updates = generateBulkUpdates(table, LOAD_TEST_UPDATES_PER_MESSAGE);
        if (updates){
            table.bulkUpdate(updates);
        }

        if (!loadTestRunning) {
            clearInterval(intervalId);
        }
    }

    intervalId = setInterval(intervalFunc, LOAD_TEST_MILLISECONDS_BETWEEN_MESSAGES);
}


async function sendMessagesNoThrottle() {
    postMessage({
        type: 'test-started',
        messageCount: STRESS_TEST_MESSAGE_COUNT,
        updateCount: STRESS_TEST_UPDATES_PER_MESSAGE,
        interval: null
    });

    const range = Range(1,STRESS_TEST_MESSAGE_COUNT);
    const {_table: table} = dataStore;
    for await (let value of range) {
        const doNotPublish = value !== range.from && value !== range.to && (value % renderInterval !== 0);
        const updates = generateBulkUpdates(table, STRESS_TEST_UPDATES_PER_MESSAGE);
        if (updates){
            table.bulkUpdate(updates, doNotPublish);
        }
    }

    postMessage({
        type: 'test-ended',
        messageCount: STRESS_TEST_MESSAGE_COUNT,
        updateCount: STRESS_TEST_UPDATES_PER_MESSAGE
    });
}

function registerMessageHandlers(){
    self.addEventListener('message', function({data: message}) {

        latestTestNumber++;
        switch (message.type) {
            case 'subscribe': {
                const result = dataStore.setRange(message.range, true);
                postMessage(result);
            }
            break;
            
            case 'setRange':{
                const result = dataStore.setRange(message.range);
                postMessage(result);
            }
            break;
    
            case 'sort':{
                const result = dataStore.sort(message.sortCriteria);
                postMessage(result);
            }

            case 'groupBy':{
                const result = dataStore.groupBy(message.groupBy);
                postMessage(result);
            }
            break;

            case 'setGroupState':{
                const result = dataStore.setGroupState(message.groupState);
                postMessage(result);
            }
            break;
    
            case 'rate':
                if (message.value > 3){
                   renderInterval += 1;
                    // console.log(`current messages/render = ${message.value} increasing renderInterval to ${renderInterval}`);
                } else if (message.value < 2){
                    renderInterval -= 1;
                // console.log(`current messages/render = ${message.value} reducing renderInterval to ${renderInterval}`);
                } else {
                // console.log(`current messages/render = ${message.value} leaving renderInterval at ${renderInterval}`);
                }     
            break;
    
            case 'startStress':
                console.log('starting stress test');
                sendMessagesNoThrottle();
                break;
            case 'startLoad':
                loadTestRunning = true;
                console.log('starting load test');
                sendMessagesWithThrottle(latestTestNumber);
                break;
            case 'stopTest':
                console.log('stopping test');
                loadTestRunning = false;
                break;
            default:
                console.log('unknown message type ' + message.type);
                break;
        }
    });
    
}

