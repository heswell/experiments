import { rangeUtils, DataTypes } from "@heswell/data";
const EMPTY_ARRAY = [];
const ROWSET = "rowset";
const UPDATE = "update";
const FILTER_DATA = "filterData";
class MessageQueue {
  constructor() {
    this._queue = [];
  }
  get length() {
    return this._queue.length;
  }
  set length(val) {
    this._queue.length = val;
  }
  get queue() {
    const q = this._queue.slice();
    this._queue.length = 0;
    return q;
  }
  push(message, meta) {
    const { type, data } = message;
    if (type === UPDATE) {
      mergeAndPurgeUpdates(this._queue, message);
    } else if (type === ROWSET) {
      if (message.data.rows.length === 0 && message.size > 0) {
        return;
      }
      mergeAndPurgeRowset(this._queue, message, meta);
    } else if (type === FILTER_DATA && data.type !== DataTypes.FILTER_BINS) {
      mergeAndPurgeFilterData(this._queue, message, meta);
    } else {
    }
    if (message.type === "rowset") {
      console.log(`[${Date.now()}] message queue push message ${JSON.stringify(message.data.range)}`);
    }
    this._queue.push(message);
  }
  purgeViewport(viewport) {
    this._queue = this._queue.filter((batch) => batch.viewport !== viewport);
  }
  extract(test) {
    if (this._queue.length === 0) {
      return EMPTY_ARRAY;
    } else {
      return extractMessages(this._queue, test);
    }
  }
  extractAll() {
    const messages = this._queue.slice();
    this._queue.length = 0;
    return messages;
  }
}
function mergeAndPurgeFilterData(queue, message, meta) {
  const { IDX } = meta;
  const { viewport, data: filterData } = message;
  const { range } = filterData;
  const { lo, hi } = rangeUtils.getFullRange(range);
  for (var i = queue.length - 1; i >= 0; i--) {
    let { type, viewport: vp, data } = queue[i];
    if (vp === viewport && type === FILTER_DATA) {
      var { lo: lo1, hi: hi1 } = rangeUtils.getFullRange(queue[i].data.range);
      var overlaps = data.rows.filter(
        (row) => row[IDX] >= lo && row[IDX] < hi
      );
      if (lo < lo1) {
        message.data = {
          ...message.data,
          rows: filterData.rows.concat(overlaps)
        };
      } else {
        message.data = {
          ...message.data,
          rows: overlaps.concat(filterData.rows)
        };
      }
      queue.splice(i, 1);
    }
  }
}
function mergeAndPurgeRowset(queue, message, meta) {
  const { viewport, data: { rows, size, range, offset = 0 } } = message;
  const { lo, hi } = rangeUtils.getFullRange(range);
  const low = lo + offset;
  const high = hi + offset;
  if (rows.length === 0) {
    console.log(`MESSAGE PUSHED TO MESAGEQ WITH NO ROWS`);
    return;
  }
  const { IDX } = meta;
  for (var i = queue.length - 1; i >= 0; i--) {
    let { type, viewport: vp, data } = queue[i];
    if (vp === viewport) {
      if (type === ROWSET) {
        var { range: { lo: lo1, hi: hi1 } } = queue[i].data;
        if (lo1 >= hi || hi1 < lo) {
        } else {
          var overlaps = data.rows.filter(
            (row) => row[IDX] >= low && row[IDX] < high
          );
          if (lo < lo1) {
            message.data.rows = rows.concat(overlaps);
          } else {
            message.data.rows = overlaps.concat(rows);
          }
        }
        queue.splice(i, 1);
      } else if (type === UPDATE) {
        let validUpdates = queue[i].updates.filter((u) => {
          let idx = u[IDX];
          if (typeof rows[IDX] === "undefined") {
            console.warn(`MessageQueue:about to error, these are the rows that have been passed `);
            console.warn(`[${rows.map((r) => r[IDX]).join(",")}]`);
          }
          let min = rows[0][IDX];
          let max = rows[rows.length - 1][IDX];
          return idx >= low && idx < high && idx < size && (idx < min || idx >= max);
        });
        if (validUpdates.length) {
          queue[i].updates = validUpdates;
        } else {
          queue.splice(i, 1);
        }
      }
    }
  }
}
function mergeAndPurgeUpdates(queue, message) {
  var { viewport, range: { lo, hi } } = message;
  for (var i = queue.length - 1; i >= 0; i--) {
    if (queue[i].type === message.type && queue[i].viewport === viewport) {
      var { lo: lo1, hi: hi1 } = queue[i].updates;
      if (lo1 >= hi || hi1 < lo) {
      } else {
      }
      console.log(`merging rowset current range [${lo},${hi}] [${queue[i].rows.lo},${queue[i].rows.hi}]`);
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
  return extract;
}
const formatMessage = (msg) => ` type: ${msg.type} 
    rows: [${msg.data && msg.data.rows && msg.data.rows.map((row) => row[7])}]`;
export {
  MessageQueue as default
};
//# sourceMappingURL=message-queue.js.map
