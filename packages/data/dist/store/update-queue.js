class UpdateQueue {
  constructor() {
    this._queue = [];
  }
  get length() {
    return this._queue.length;
  }
  update(update) {
    const batch = this.getCurrentBatch("update");
    const [rowIdx] = update;
    const { updates } = batch;
    for (let i = 0, len = updates.length; i < len; i++) {
      if (updates[i][0] === rowIdx) {
        let d = updates[i];
        for (let colIdx = 1; colIdx < update.length; colIdx += 2) {
          const pos = d.indexOf(update[colIdx]);
          if (pos === -1) {
            d.push(update[colIdx], update[colIdx + 1]);
          } else {
            d[pos + 1] = update[colIdx + 1];
          }
        }
        return;
      }
    }
    updates.push(update);
  }
  resize(size) {
    const batch = this.getCurrentBatch("size");
    batch.size = size;
  }
  append(row, offset) {
    const batch = this.getCurrentBatch("insert");
    batch.rows.push(row);
    batch.offset = offset;
  }
  replace({ rows, filter, size, range, offset }) {
    const batch = this.getCurrentBatch("rowset");
    batch.rows = rows;
    batch.size = size;
    batch.range = range;
    batch.offset = offset;
    batch.filter = filter;
  }
  popAll() {
    const results = this._queue;
    this._queue = [];
    return results;
  }
  getCurrentBatch(type) {
    const q = this._queue;
    const len = q.length;
    let batch = len === 0 || type === "rowset" ? q[0] = createBatch(type) : q[len - 1];
    if (batch.type !== type) {
      if (type === "insert" && batch.type === "size") {
        batch.type = "insert";
        batch.rows = [];
      } else if (type === "size" && batch.type === "insert") {
      } else {
        batch = q[len] = createBatch(type);
      }
    }
    return batch;
  }
}
function createBatch(type) {
  switch (type) {
    case "rowset":
      return { type, rows: [] };
    case "update":
      return { type, updates: [] };
    case "insert":
      return { type, rows: [] };
    case "size":
      return { type };
    default:
      throw Error("Unknown batch type");
  }
}
export {
  UpdateQueue as default
};
//# sourceMappingURL=update-queue.js.map
