
import { rangeUtils, DataTypes } from '../data';

const EMPTY_ARRAY = [];
const ROWSET = 'rowset';
const UPDATE = 'update';
const FILTER_DATA = 'filterData';

export default class MessageQueue {

    constructor() {
        this._queue = [];
    }

    get length() { return this._queue.length; }
    set length(val) { this._queue.length = val; }
    get queue() {
        const q = this._queue.slice();
        this._queue.length = 0;
        return q;
    }

    push(message, meta) {
        console.log(`MessageQueue. push<${message.type}|${message.dataType || ''}> ${JSON.stringify(message.range || (message.data && message.data.range))}`);

        const { type, data } = message;
        if (type === UPDATE) {
            //onsole.log(`MessageQueue. UPDATE pushed ${JSON.stringify(message)}`);
            mergeAndPurgeUpdates(this._queue, message);
        } else if (type === ROWSET) {
            if (message.data.rows.length === 0 && message.size > 0) {
                return;
            }
            mergeAndPurgeRowset(this._queue, message, meta);

        } else if (type === FILTER_DATA && data.type !== DataTypes.FILTER_BINS) {
            mergeAndPurgeFilterData(this._queue, message, meta);
        } else {
            //onsole.log(`MessageQueue ${type} `);
        }

        this._queue.push(message);

    }

    purgeViewport(viewport) {
        this._queue = this._queue.filter(batch => batch.viewport !== viewport);
    }

    extract(test) {
        if (this._queue.length === 0) {
            return EMPTY_ARRAY;
        } else {
            return extractMessages(this._queue, test);
        }
    }
}


// This purges redundant messages from the queue and merges their data into the new message. 
// AN unintended consequence of this might be that data slips down the queue, as the new 
// message is added at the back of the queue - INVESTIGATE.
function mergeAndPurgeFilterData(queue, message, meta) {
    const {IDX} = meta;
    //onsole.log(`mergeAndPurgeFiltreData new message with range ${JSON.stringify(message.data.range)}`);
    const { viewport, data: filterData } = message;
    const { range, size } = filterData;
    const { lo, hi } = rangeUtils.getFullRange(range);

    for (var i = queue.length - 1; i >= 0; i--) {

        let { type, viewport: vp, data } = queue[i];

        if (vp === viewport && type === FILTER_DATA) {

            var { lo: lo1, hi: hi1 } = rangeUtils.getFullRange(queue[i].data.range);

            if ((lo1 === 0 && hi1 === 0 && lo === 0) ||
                (lo1 >= hi || hi1 < lo)) {
                message.data = {
                    ...message.data,
                    selectedIndices: data.selectedIndices
                };
            }
            else {
                var overlaps = data.rows.filter(
                    row => row[IDX] >= lo && row[IDX] < hi);

                // TODO selectedIndices    
                if (lo < lo1) {
                    message.data = {
                        ...message.data,
                        rows: filterData.rows.concat(overlaps)
                    };
                }
                else {
                    message.data = {
                        ...message.data,
                        rows: overlaps.concat(filterData.rows)
                    };
                }

            }
            queue.splice(i, 1);
        }
    }
}

// we need to know the current range in order to be able to merge rowsets which are still valid
function mergeAndPurgeRowset(queue, message, meta) {
    const { viewport, data: { rows, size, range, offset=0 } } = message;
    const { lo, hi } = rangeUtils.getFullRange(range);
    const low = lo + offset;
    const high = hi + offset;

    if (rows.length === 0){
        console.log(`MESSAGE PUSHED TO MESAGEQ WITH NO ROWS`);
        return;
    }

    const {IDX} = meta;

    for (var i = queue.length - 1; i >= 0; i--) {

        let { type, viewport: vp, data } = queue[i];

        if (vp === viewport) {

            if (type === ROWSET) { // snapshot. filterData, searchData 

                var { range: { lo: lo1, hi: hi1 } } = queue[i].data;

                if (lo1 >= hi || hi1 < lo) {
                    // no overlap, purge the message
                }
                else {
                    var overlaps = data.rows.filter(
                        row => row[IDX] >= low && row[IDX] < high);

                    if (lo < lo1) {
                        message.data.rows = rows.concat(overlaps);
                    }
                    else {
                        message.data.rows = overlaps.concat(rows);
                    }
                }
                queue.splice(i, 1);
            }
            else if (type === UPDATE) {
                // if we have updates for rows within the current rowset, discard them - the rowset
                // represents latest data.
                let validUpdates = queue[i].updates.filter(u => {
                    let idx = u[IDX];

                    if (typeof rows[IDX] === 'undefined') {
                        console.warn(`MessageQueue:about to error, these are the rows that have been passed `);
                        console.warn(`[${rows.map(r => r[IDX]).join(',')}]`);
                    }


                    let min = rows[0][IDX];
                    let max = rows[rows.length - 1][IDX];

                    return idx >= low && idx < high &&   	// within range 
                        idx < size &&  				// within dataset  
                        (idx < min || idx >= max); 		// NOT within new rowset 
                });

                if (validUpdates.length) {
                    queue[i].updates = validUpdates;
                }
                else {
                    //onsole.log(`MessageQueue:purging updates that are no longer applicable`);
                    queue.splice(i, 1);
                }
            }


        }
    }
}

// we need to know the current range in order to be able to merge rowsets which are still valid
function mergeAndPurgeUpdates(queue, message) {

    //onsole.log(`mergeAndPurge: update message ${JSON.stringify(message)}` );

    var { viewport, range: { lo, hi } } = message;

    //onsole.log(`mergeAndPurge: update message ${lo} - ${hi}   ${JSON.stringify(queue)}` );

    for (var i = queue.length - 1; i >= 0; i--) {

        if (queue[i].type === message.type && queue[i].viewport === viewport) {

            //onsole.log(`we have a match for an update ${i} of ${queue.length}   ${JSON.stringify(queue[i].updates)}`)

            var { lo: lo1, hi: hi1 } = queue[i].updates;

            if (lo1 >= hi || hi1 < lo) {
                // no overlap, purge the message
            }
            else {
                // merge updates for same row(s)
                //onsole.log(`mergeAndPurgeUpdates ${JSON.stringify(queue[i])} ${JSON.stringify(message.updates)}`)
            }
            //onsole.log(`merging rowset current range [${lo},${hi}] [${queue[i].rows.lo},${queue[i].rows.hi}]`);
            queue.splice(i, 1);
        }
    }
}

function extractMessages(queue, test) {
    var extract = [];

    for (var i = queue.length - 1; i >= 0; i--) {
        if (test(queue[i])) {
            extract.push(queue.splice(i, 1)[0]);
        }
    }

    extract.reverse();
    // console.log(`extracted messages ${JSON.stringify(extract.map(formatMessage))}\n\n`)
    return extract;
}

// const formatMessage = msg => `type: ${msg.type} rows: [${msg.data && msg.data.rows.map(row => row[0])}]`;
