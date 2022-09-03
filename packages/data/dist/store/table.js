import { EventEmitter } from "./event-emitter.js";
import { buildColumnMap } from "./columnUtils.js";
const defaultUpdateConfig = {
  applyUpdates: false,
  applyInserts: false,
  interval: 500
};
class Table extends EventEmitter {
  constructor(config) {
    super();
    const { name, columns = null, primaryKey, dataPath, data, updates = {} } = config;
    this.name = name;
    this.primaryKey = primaryKey;
    this.columns = columns;
    this.keys = {};
    this.index = {};
    this.rows = [];
    this.updateConfig = {
      ...defaultUpdateConfig,
      ...updates
    };
    this.columnMap = buildColumnMap(columns);
    this.columnCount = 0;
    this.status = null;
    if (data) {
      this.parseData(data);
    } else if (dataPath) {
      this.loadData(dataPath);
    }
    this.installDataGenerators(config);
  }
  update(rowIdx, ...updates) {
    const results = [];
    let row = this.rows[rowIdx];
    for (let i = 0; i < updates.length; i += 2) {
      const colIdx = updates[i];
      const value = updates[i + 1];
      results.push(colIdx, row[colIdx], value);
      row[colIdx] = value;
    }
    this.emit("rowUpdated", rowIdx, results);
  }
  insert(data) {
    let columnnameList = this.columns ? this.columns.map((c) => c.name) : null;
    const idx = this.rows.length;
    let row = this.rowFromData(idx, data, columnnameList);
    this.rows.push(row);
    this.emit("rowInserted", idx, row);
  }
  remove(key) {
    if (this.keys[key]) {
      const index = this.indices[key];
      delete this.keys[key];
      delete this.indices[key];
      this.rows.splice(index, 1);
      for (let k in this.indices) {
        if (this.indices[k] > index) {
          this.indices[k] -= 1;
        }
      }
      this.emit("rowRemoved", this.name, key);
    }
  }
  clear() {
  }
  toString() {
    const out = ["\n" + this.name];
    out.splice.apply(
      out,
      [1, 0].concat(
        this.rows.map(function(row) {
          return row.toString();
        })
      )
    );
    return out.join("\n");
  }
  async loadData(url) {
    fetch(url, {}).then((data) => data.json()).then((json) => {
      console.log(`Table.loadData: got ${json.length} rows`);
      this.parseData(json);
    }).catch((err) => {
      console.error(err);
    });
  }
  parseData(data) {
    let columnnameList = this.columns ? this.columns.map((c) => c.name) : null;
    const rows = [];
    for (let i = 0; i < data.length; i++) {
      let row = this.rowFromData(i, data[i], columnnameList);
      rows.push(row);
    }
    this.rows = rows;
    if (this.columns === null) {
      this.columns = columnsFromColumnMap(this.inputColumnMap);
      this.columnMap = buildColumnMap(this.columns);
    }
    this.status = "ready";
    this.emit("ready");
    if (this.updateConfig && this.updateConfig.applyUpdates !== false) {
      setTimeout(() => {
        this.applyUpdates();
      }, 1e3);
    }
    if (this.updateConfig && this.updateConfig.applyInserts !== false) {
      setTimeout(() => {
        this.applyInserts();
      }, 1e4);
    }
  }
  rowFromData(idx, data, columnnameList) {
    const { index, primaryKey = null, columnMap: map } = this;
    if (Array.isArray(data)) {
      const key = data[map[this.primaryKey]];
      index[key] = idx;
      return [...data, idx, key];
    } else {
      const columnMap = map || (this.columnMap = {});
      const colnames = columnnameList || Object.getOwnPropertyNames(data);
      const row = [idx];
      let colIdx;
      let key;
      for (let i = 0; i < colnames.length; i++) {
        const name = colnames[i];
        const value = data[name];
        if ((colIdx = columnMap[name]) === void 0) {
          colIdx = columnMap[name] = this.columnCount++;
        }
        row[colIdx] = value;
        if (name === primaryKey || primaryKey === null && i === 0) {
          key = value;
          index[value] = idx;
        }
      }
      row.push(idx, key);
      return row;
    }
  }
  applyInserts() {
    const idx = this.rows.length;
    const newRow = this.createRow(idx);
    if (newRow) {
      this.insert(newRow);
    } else {
      console.log(`createRow did not return a new row`);
    }
    setTimeout(() => this.applyInserts(), this.updateConfig.insertInterval | 100);
  }
  applyUpdates() {
    const { rows, columnMap } = this;
    const count = 100;
    for (let i = 0; i < count; i++) {
      const rowIdx = getRandomInt(rows.length - 1);
      const update = this.updateRow(rowIdx, rows[rowIdx], columnMap);
      if (update) {
        this.update(rowIdx, ...update);
      }
    }
    setTimeout(() => this.applyUpdates(), this.updateConfig.interval);
  }
  createRow(idx) {
    console.warn(`createRow ${idx} must be implemented as a plugin`);
  }
  updateRow() {
    return null;
  }
  async installDataGenerators() {
  }
}
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}
function columnsFromColumnMap(columnMap) {
  const columnNames = Object.getOwnPropertyNames(columnMap);
  return columnNames.map((name) => ({ name, key: columnMap[name] })).sort(byKey).map(({ name }) => ({ name }));
}
function byKey(col1, col2) {
  return col1.key - col2.key;
}
export {
  Table as default
};
//# sourceMappingURL=table.js.map
