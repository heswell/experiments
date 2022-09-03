import { buildColumnMap, getFilterType, toColumn } from "./columnUtils.js";
import { addFilter, IN, NOT_IN } from "./filter.js";
import { resetRange } from "./rangeUtils.js";
import { GroupRowSet, RowSet } from "./rowset/index.js";
import { DataTypes } from "./types.js";
import UpdateQueue from "./update-queue.js";
const DEFAULT_INDEX_OFFSET = 100;
const WITH_STATS = true;
class DataView {
  constructor(table, { columns = [], sort = null, groupBy = null, filterSpec = null }, updateQueue = new UpdateQueue()) {
    this._table = table;
    this._index_offset = DEFAULT_INDEX_OFFSET;
    this._filter = filterSpec;
    this._groupState = null;
    this._sortCriteria = sort;
    this._columns = null;
    this._columnMap = null;
    this.columns = columns;
    this._groupby = groupBy;
    this._update_queue = updateQueue;
    this.rowSet = new RowSet(table, this._columns, this._index_offset);
    this.filterRowSet = null;
    if (groupBy !== null) {
      this.rowSet = new GroupRowSet(this.rowSet, this._columns, this._groupby, this._groupState);
    } else if (this._sortCriteria !== null) {
      this.rowSet.sort(this._sortCriteria);
    }
    this.rowUpdated = this.rowUpdated.bind(this);
    this.rowInserted = this.rowInserted.bind(this);
    table.on("rowUpdated", this.rowUpdated);
    table.on("rowInserted", this.rowInserted);
  }
  set columns(columns) {
    this._columns = columns.map(toColumn);
    this._columnMap = buildColumnMap(this._columns);
  }
  destroy() {
    this._table.removeListener("rowUpdated", this.rowUpdated);
    this._table.removeListener("rowInserted", this.rowInserted);
    this._table = null;
    this.rowSet = null;
    this.filterRowSet = null;
    this._update_queue = null;
  }
  get status() {
    return this._table.status;
  }
  rowInserted(event, idx, row) {
    const { _update_queue, rowSet } = this;
    const { size = null, replace, updates } = rowSet.insert(idx, row);
    if (size !== null) {
      _update_queue.resize(size);
    }
    if (replace) {
      const { rows, size: size2, offset } = rowSet.currentRange();
      _update_queue.replace({ rows, size: size2, offset });
    } else if (updates) {
      updates.forEach((update) => {
        _update_queue.update(update);
      });
    }
  }
  rowUpdated(event, idx, updates) {
    const { rowSet, _update_queue } = this;
    const result = rowSet.update(idx, updates);
    if (result) {
      if (rowSet instanceof RowSet) {
        _update_queue.update(result);
      } else {
        result.forEach((rowUpdate) => {
          _update_queue.update(rowUpdate);
        });
      }
    }
  }
  getData(dataType) {
    return dataType === DataTypes.ROW_DATA ? this.rowSet : dataType === DataTypes.FILTER_DATA ? this.filterRowSet : null;
  }
  setRange(range, useDelta = true, dataType = DataTypes.ROW_DATA) {
    return this.getData(dataType).setRange(range, useDelta);
  }
  select(idx, rangeSelect, keepExistingSelection, dataType = DataTypes.ROW_DATA) {
    const rowset = this.getData(dataType);
    const updates = rowset.select(idx, rangeSelect, keepExistingSelection);
    if (dataType === DataTypes.ROW_DATA) {
      return this.selectResponse(updates, dataType, rowset);
    } else {
      console.log(`[dataView] select on filterSet (range ${JSON.stringify(rowset.range)})`);
      const value = rowset.getSelectedValue(idx);
      const isSelected = rowset.selected.rows.includes(idx);
      const filter = {
        type: isSelected ? IN : NOT_IN,
        colName: rowset.columnName,
        values: [value]
      };
      this.applyFilterSetChangeToFilter(filter);
      if (updates.length > 0) {
        return {
          dataType,
          updates,
          stats: rowset.stats
        };
      }
    }
  }
  selectAll(dataType = DataTypes.ROW_DATA) {
    const rowset = this.getData(dataType);
    return this.selectResponse(rowset.selectAll(), dataType, rowset, true);
  }
  selectNone(dataType = DataTypes.ROW_DATA) {
    const rowset = this.getData(dataType);
    return this.selectResponse(rowset.selectNone(), dataType, rowset, false);
  }
  selectResponse(updates, dataType, rowset, allSelected) {
    const updatesInViewport = updates.length > 0;
    const { stats } = rowset;
    if (dataType === DataTypes.ROW_DATA) {
      if (updatesInViewport) {
        return { updates };
      }
    } else {
      const { totalRowCount, totalSelected } = stats;
      if (totalSelected === 0) {
        this.applyFilterSetChangeToFilter({ colName: rowset.columnName, type: IN, values: [] });
      } else if (totalSelected === totalRowCount) {
        this.applyFilterSetChangeToFilter({ colName: rowset.columnName, type: NOT_IN, values: [] });
      } else {
        if (allSelected) {
          this.applyFilterSetChangeToFilter({
            colName: rowset.columnName,
            type: IN,
            values: rowset.values
          });
        } else {
          this.applyFilterSetChangeToFilter({
            colName: rowset.columnName,
            type: NOT_IN,
            values: rowset.values
          });
        }
      }
      return {
        dataType,
        updates,
        stats: rowset.stats
      };
    }
  }
  sort(sortCriteria) {
    this._sortCriteria = sortCriteria;
    this.rowSet.sort(sortCriteria);
    return this.setRange(resetRange(this.rowSet.range), false);
  }
  filter(filter, dataType = DataTypes.ROW_DATA, incremental = false, ignoreFilterRowset = false) {
    if (dataType === DataTypes.FILTER_DATA) {
      return [void 0, this.filterFilterData(filter)];
    } else {
      if (incremental) {
        filter = addFilter(this._filter, filter);
      }
      const { rowSet, _filter, filterRowSet } = this;
      const { range } = rowSet;
      this._filter = filter;
      let filterResultset;
      if (filter === null && _filter) {
        rowSet.clearFilter();
      } else if (filter) {
        this.rowSet.filter(filter);
      } else {
        throw Error(`InMemoryView.filter setting null filter when we had no filter anyway`);
      }
      if (filterRowSet && dataType === DataTypes.ROW_DATA && !ignoreFilterRowset) {
        if (filter) {
          if (filterRowSet.type === DataTypes.FILTER_DATA) {
            filterResultset = filterRowSet.setSelectedFromFilter(filter);
          } else if (filterRowSet.type === DataTypes.FILTER_BINS) {
            this.filterRowSet = rowSet.getBinnedValuesForColumn({
              name: this.filterRowSet.columnName
            });
            filterResultset = this.filterRowSet.setRange();
          }
        } else {
          const { columnName, range: range2 } = filterRowSet;
          this.filterRowSet = rowSet.getDistinctValuesForColumn({ name: columnName });
          filterResultset = this.filterRowSet.setRange(range2, false);
        }
      }
      const resultSet = {
        ...this.rowSet.setRange(resetRange(range), false),
        filter
      };
      return filterResultset ? [resultSet, filterResultset] : [resultSet];
    }
  }
  filterFilterData(filter) {
    const { filterRowSet } = this;
    if (filterRowSet) {
      if (filter === null) {
        filterRowSet.clearFilter();
      } else if (filter) {
        filterRowSet.filter(filter);
      }
      return filterRowSet.setRange(resetRange(filterRowSet.range), false, WITH_STATS);
    } else {
      console.error(`[InMemoryView] filterfilterRowSet no filterRowSet`);
    }
  }
  applyFilterSetChangeToFilter(partialFilter) {
    const [result] = this.filter(partialFilter, DataTypes.ROW_DATA, true, true);
    this._update_queue.replace(result);
  }
  applyFilter() {
  }
  groupBy(groupby) {
    const { rowSet, _columns, _groupState, _sortCriteria, _groupby } = this;
    const { range: _range } = rowSet;
    this._groupby = groupby;
    if (groupby === null) {
      this.rowSet = RowSet.fromGroupRowSet(this.rowSet);
    } else {
      if (_groupby === null) {
        this.rowSet = new GroupRowSet(rowSet, _columns, groupby, _groupState, _sortCriteria);
      } else {
        rowSet.groupBy(groupby);
      }
    }
    return this.rowSet.setRange(_range, false);
  }
  setGroupState(groupState) {
    this._groupState = groupState;
    const { rowSet } = this;
    rowSet.setGroupState(groupState);
    return rowSet.setRange(rowSet.range, false);
  }
  get updates() {
    const {
      _update_queue,
      rowSet: { range }
    } = this;
    let results = {
      updates: _update_queue.popAll(),
      range: {
        lo: range.lo,
        hi: range.hi
      }
    };
    return results;
  }
  getFilterData(column, range) {
    console.log(`dataView.getFilterData for column ${column.name} range ${JSON.stringify(range)}`);
    const { rowSet, filterRowSet, _filter: filter, _columnMap } = this;
    const columnName = column.name;
    const colDef = this._columns.find((col) => col.name === columnName);
    const type = getFilterType(colDef);
    if (type === "number") {
      this.filterRowSet = rowSet.getBinnedValuesForColumn(column);
    } else if (!filterRowSet || filterRowSet.columnName !== column.name) {
      console.log(`create the filterRowset`);
      this.filterRowSet = rowSet.getDistinctValuesForColumn(column);
    } else if (filterRowSet && filterRowSet.columnName === column.name) {
      filterRowSet.setRange({ lo: 0, hi: 0 });
    }
    if (filter) {
      this.filterRowSet.setSelectedFromFilter(filter);
    } else {
      this.filterRowSet.selectAll();
    }
    console.log(`[dataView] return filterSet range ${JSON.stringify(range)}`);
    return this.filterRowSet.setRange(range, false, WITH_STATS);
  }
}
export {
  DataView as default
};
//# sourceMappingURL=data-view.js.map
