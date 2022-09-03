import { metaData } from "./columnUtils.js";
import { GROUP_ROW_TEST, sortBy, sortPosition } from "./sort.js";
import { ASC } from "./types.js";
const LEAF_DEPTH = 0;
const DEFAULT_OPTIONS = {
  startIdx: 0,
  rootIdx: null,
  rootExpanded: true,
  baseGroupby: []
};
function lowestIdxPointer(groups, IDX, DEPTH, start, depth) {
  let result = Number.MAX_SAFE_INTEGER;
  for (let i = start; i < groups.length; i++) {
    const group = groups[i];
    const absDepth = Math.abs(group[DEPTH]);
    if (absDepth > depth) {
      break;
    } else if (absDepth === depth) {
      const idx = group[IDX];
      if (typeof idx === "number" && idx < result) {
        result = idx;
      }
    }
  }
  return result === Number.MAX_SAFE_INTEGER ? void 0 : result;
}
function getCount(groupRow, PRIMARY_COUNT, FALLBACK_COUNT) {
  return typeof groupRow[PRIMARY_COUNT] === "number" ? groupRow[PRIMARY_COUNT] : groupRow[FALLBACK_COUNT];
}
class SimpleTracker {
  constructor(levels) {
    this.levels = Array(levels).fill(0).reduce((acc, el, i) => {
      acc[i + 1] = { key: null, pos: null, pPos: null };
      return acc;
    }, {});
  }
  set(depth, pos, groupKey) {
    if (this.levels) {
      const level = this.levels[Math.abs(depth)];
      if (level && level.key !== groupKey) {
        if (level.key !== null) {
          level.pPos = level.pos;
        }
        level.key = groupKey;
        level.pos = pos;
      }
    }
  }
  hasParentPos(level) {
    return this.levels[level + 1] && this.levels[level + 1].pos !== null;
  }
  parentPos(level) {
    return this.levels[level + 1].pos;
  }
  hasPreviousPos(level) {
    return this.levels[level] && this.levels[level].pPos !== null;
  }
  previousPos(level) {
    return this.levels[level].pPos;
  }
}
class GroupIdxTracker {
  constructor(levels) {
    this.idxAdjustment = 0;
    this.maxLevel = levels + 1;
    this.levels = levels > 0 ? Array(levels).fill(0).reduce((acc, el, i) => {
      acc[i + 2] = { key: null, current: 0, previous: 0 };
      return acc;
    }, {}) : null;
  }
  increment(count) {
    this.idxAdjustment += count;
    if (this.levels) {
      for (let i = 2; i < this.maxLevel + 1; i++) {
        this.levels[i].current += count;
      }
    }
  }
  previous(level) {
    return this.levels && this.levels[level] && this.levels[level].previous || 0;
  }
  hasPrevious(level) {
    return this.previous(level) > 0;
  }
  get(idx) {
    return this.levels === null ? null : this.levels[idx];
  }
  set(depth, groupKey) {
    if (this.levels) {
      const level = this.levels[depth];
      if (level && level.key !== groupKey) {
        if (level.key !== null) {
          level.previous += level.current;
          level.current = 0;
        }
        level.key = groupKey;
      }
    }
  }
}
const itemIsNumeric = (item) => !isNaN(parseInt(item, 10));
const numerically = (a, b) => parseInt(a) - parseInt(b);
function sortKeys(o) {
  const keys = Object.keys(o);
  if (keys.every(itemIsNumeric)) {
    return keys.sort(numerically);
  } else {
    return keys.sort();
  }
}
function fillNavSetsFromGroups(groups, sortSet, sortIdx = 0, filterSet = null, filterIdx, filterLen) {
  const keys = sortKeys(groups);
  const filtered = filterSet !== null;
  const filterIndices = filtered ? filterSet.slice(filterIdx, filterLen) : null;
  for (let i = 0; i < keys.length; i++) {
    const groupedRows = groups[keys[i]];
    if (Array.isArray(groupedRows)) {
      for (let j = 0, len = groupedRows.length; j < len; j++) {
        const rowIdx = groupedRows[j];
        sortSet[sortIdx] = rowIdx;
        sortIdx += 1;
        if (filtered && filterIndices.includes(rowIdx)) {
          filterSet[filterIdx] = rowIdx;
          filterIdx += 1;
        }
      }
    } else {
      sortIdx = fillNavSetsFromGroups(groupedRows, sortSet, sortIdx);
    }
  }
  return sortIdx;
}
function groupRows(rows, sortSet, columns, columnMap, groupby, options = DEFAULT_OPTIONS) {
  const {
    startIdx = 0,
    length = rows.length,
    rootIdx = null,
    baseGroupby = [],
    groups = [],
    rowParents = null,
    filterLength,
    filterSet,
    filterFn: filter
  } = options;
  let { groupIdx = -1, filterIdx } = options;
  const aggregations = findAggregatedColumns(columns, columnMap, groupby);
  const groupedLeafRows = groupLeafRows(sortSet, rows, groupby, startIdx, length);
  fillNavSetsFromGroups(groupedLeafRows, sortSet, startIdx, filterSet, filterIdx, filterLength);
  const levels = groupby.length;
  const currentGroups = Array(levels).fill(null);
  const { IDX, DEPTH, FILTER_COUNT, NEXT_FILTER_IDX } = metaData(columns);
  let parentIdx = rootIdx;
  let leafCount = 0;
  for (let i = startIdx, len = startIdx + length; i < len; i++) {
    const rowIdx = sortSet[i];
    const row = rows[rowIdx];
    for (let level = 0; level < levels; level++) {
      const [columnIdx] = groupby[level];
      const currentGroup = currentGroups[level];
      const groupValue = row[columnIdx];
      if (currentGroup === null || currentGroup[columnIdx] !== groupValue) {
        if (currentGroup !== null) {
          for (let ii = levels - 1; ii >= level; ii--) {
            const group = currentGroups[ii];
            aggregate(group, groups, sortSet, rows, columns, aggregations, leafCount, filter);
            if (filterSet && Math.abs(group[DEPTH]) === 1 && group[FILTER_COUNT] > 0) {
              group[NEXT_FILTER_IDX] = filterIdx;
              filterIdx += group[FILTER_COUNT];
            }
          }
          leafCount = 0;
        }
        for (let ii = level; ii < levels; ii++) {
          groupIdx += 1;
          parentIdx = ii === 0 ? rootIdx : currentGroups[ii - 1][IDX];
          const depth = levels - ii;
          const childIdx = depth === 1 ? i : groupIdx + 1;
          const groupRow = currentGroups[ii] = GroupRow(
            row,
            depth,
            groupIdx,
            childIdx,
            parentIdx,
            groupby,
            columns,
            columnMap,
            baseGroupby
          );
          groups.push(groupRow);
        }
        break;
      }
    }
    rowParents && (rowParents[rowIdx] = groupIdx);
    leafCount += 1;
  }
  for (let i = levels - 1; i >= 0; i--) {
    if (currentGroups[i] !== null) {
      const group = currentGroups[i];
      aggregate(group, groups, sortSet, rows, columns, aggregations, leafCount, filter);
      if (filterSet && Math.abs(group[DEPTH]) === 1 && group[FILTER_COUNT] > 0) {
        group[NEXT_FILTER_IDX] = filterIdx;
      }
    }
  }
  return groups;
}
function groupbyExtendsExistingGroupby(groupBy, existingGroupBy) {
  return groupBy.length > existingGroupBy.length && existingGroupBy.every((g, i) => g[0] === groupBy[i][0]);
}
function groupbyReducesExistingGroupby(groupby, existingGroupby) {
  return existingGroupby.length > groupby.length && groupby[0][0] === existingGroupby[0][0] && groupby.every(([key]) => existingGroupby.find(([key2]) => key2 === key));
}
function groupbySortReversed(groupBy, existingGroupBy) {
  const [col] = findSortedCol(groupBy, existingGroupBy);
  return col !== null;
}
function findDoomedColumnDepths(groupby, existingGroupby) {
  const count = existingGroupby.length;
  return existingGroupby.reduce((results, [colIdx], idx) => {
    if (!groupby.some((group) => group[0] === colIdx)) {
      results.push(count - idx);
    }
    return results;
  }, []);
}
function findSortedCol(groupby, existingGroupby) {
  let results = [null];
  let len1 = groupby && groupby.length;
  let len2 = existingGroupby && existingGroupby.length;
  if (len1 && len2 && len1 === len2) {
    for (let i = 0; i < len1; i++) {
      if (groupby[i][0] !== existingGroupby[i][0]) {
        return results;
      } else if (groupby[i][1] !== existingGroupby[i][1]) {
        results[0] = i;
        results[1] = len1 - i;
      }
    }
  }
  return results;
}
function byKey([key1], [key2]) {
  return key1 > key2 ? 1 : key2 > key1 ? -1 : 0;
}
const EMPTY = {};
function getGroupStateChanges(groupState, existingGroupState = null, baseKey = "", groupIdx = 0) {
  const results = [];
  const entries = Object.entries(groupState);
  entries.forEach(([key, value]) => {
    if (value && (existingGroupState === null || !existingGroupState[key])) {
      results.push([baseKey + key, groupIdx, true]);
      if (value !== null && typeof value === "object" && Object.keys(value).length > 0) {
        const diff = getGroupStateChanges(value, EMPTY, baseKey + key + "/", groupIdx + 1);
        if (diff.length) {
          results.push(...diff);
        }
      }
    } else if (value) {
      const diff = getGroupStateChanges(
        value,
        existingGroupState[key],
        baseKey + key + "/",
        groupIdx + 1
      );
      if (diff.length) {
        results.push(...diff);
      }
    }
  });
  if (existingGroupState !== null && typeof existingGroupState === "object") {
    Object.entries(existingGroupState).forEach(([key, value]) => {
      if (value && !groupState[key]) {
        results.push([baseKey + key, groupIdx, false]);
      }
    });
  }
  return results.sort(byKey);
}
function getDirection(depth, groupby) {
  const idx = groupby.length - depth;
  const [, direction] = groupby[idx];
  return direction;
}
function updateGroupBy(existingGroupBy = null, column) {
  console.log(``);
  if (existingGroupBy === null) {
    return [[column.name, ASC]];
  } else {
    return indexOfCol(column.name, existingGroupBy) === -1 ? existingGroupBy.concat([[column.name, ASC]]) : existingGroupBy.length === 1 ? null : existingGroupBy.filter(([colName]) => colName !== column.name);
  }
}
function expanded(group, groupby, groupState) {
  const groupIdx = groupby.length - Math.abs(group[1]);
  let groupVal;
  let stateEntry = groupState;
  for (let i = 0; i <= groupIdx; i++) {
    const [colIdx] = groupby[i];
    groupVal = group[colIdx];
    if (i === groupIdx) {
      return stateEntry[groupVal];
    } else {
      stateEntry = stateEntry[groupVal];
      if (!stateEntry) {
        return false;
      }
    }
  }
  return false;
}
function indexOfCol(key, cols = null) {
  if (cols !== null) {
    for (let i = 0; i < cols.length; i++) {
      const [col1, , col2] = cols[i];
      if (col1 === key || col2 === key) {
        return i;
      }
    }
  }
  return -1;
}
function allGroupsExpanded(groups, group, { DEPTH, PARENT_IDX }) {
  do {
    if (group[DEPTH] < 0) {
      return false;
    }
    group = groups[group[PARENT_IDX]];
  } while (group);
  return true;
}
function adjustGroupIndices(groups, grpIdx, { IDX, DEPTH, IDX_POINTER, PARENT_IDX }, adjustment = 1) {
  for (let i = 0; i < groups.length; i++) {
    if (groups[i][IDX] >= grpIdx) {
      groups[i][IDX] += adjustment;
      if (Math.abs(groups[i][DEPTH]) > 1) {
        groups[i][IDX_POINTER] += adjustment;
      }
      let parentIdx = groups[i][PARENT_IDX];
      if (parentIdx !== null && parentIdx >= grpIdx) {
        groups[i][PARENT_IDX] += adjustment;
      }
    }
  }
}
function adjustLeafIdxPointers(groups, insertionPoint, { DEPTH, IDX_POINTER }, adjustment = 1) {
  for (let i = 0; i < groups.length; i++) {
    if (Math.abs(groups[i][DEPTH]) === 1 && groups[i][IDX_POINTER] >= insertionPoint) {
      groups[i][IDX_POINTER] += adjustment;
    }
  }
}
function findGroupPositions(groups, groupby, row) {
  const positions = [];
  out:
    for (let i = 0; i < groupby.length; i++) {
      const sorter = sortBy(groupby.slice(0, i + 1), GROUP_ROW_TEST);
      const position = sortPosition(groups, sorter, row, "first-available");
      const group = groups[position];
      if (group === void 0) {
        break;
      }
      for (let j = 0; j < groupby.length; j++) {
        const colIdx = groupby[j][0];
        const colValue = group[colIdx];
        if (j > i) {
          if (colValue !== null) {
            break out;
          }
        } else if (colValue !== row[colIdx]) {
          break out;
        }
      }
      positions.push(position);
    }
  return positions;
}
const expandRow = (groupCols, row, meta) => {
  const r = row.slice();
  r[meta.IDX] = 0;
  r[meta.DEPTH] = 0;
  r[meta.COUNT] = 0;
  r[meta.KEY] = buildGroupKey(groupCols, row);
  r[meta.SELECTED] = 0;
  return r;
};
function buildGroupKey(groupby, row) {
  const extractKey = ([idx]) => row[idx];
  return groupby.map(extractKey).join("/");
}
function GroupRow(row, depth, idx, childIdx, parentIdx, groupby, columns, columnMap, baseGroupby = []) {
  const { IDX, RENDER_IDX, DEPTH, COUNT, KEY, SELECTED, PARENT_IDX, IDX_POINTER, count } = metaData(columns);
  const group = Array(count);
  const groupIdx = groupby.length - depth;
  let colIdx;
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    const key = columnMap[column.name];
    if (column.aggregate) {
      group[key] = 0;
    } else if ((colIdx = indexOfCol(key, groupby)) !== -1 && colIdx <= groupIdx) {
      group[key] = row[key];
    } else {
      group[key] = null;
    }
  }
  for (let i = 0; i < baseGroupby.length; i++) {
    const [colIdx2] = baseGroupby[i];
    group[colIdx2] = row[colIdx2];
  }
  const extractKey = ([idx2]) => row[idx2];
  const buildKey = (groupby2) => groupby2.map(extractKey).join("/");
  const baseKey = baseGroupby.length > 0 ? buildKey(baseGroupby) + "/" : "";
  const groupKey = buildKey(groupby.slice(0, groupIdx + 1));
  group[IDX] = idx;
  group[RENDER_IDX] = 0;
  group[DEPTH] = -depth;
  group[COUNT] = 0;
  group[KEY] = baseKey + groupKey;
  group[SELECTED] = 0;
  group[IDX_POINTER] = childIdx;
  group[PARENT_IDX] = parentIdx;
  return group;
}
function groupLeafRows(sortSet, leafRows, groupby, startIdx = 0, length = sortSet.length) {
  const groups = {};
  const levels = groupby.length;
  const lastLevel = levels - 1;
  for (let i = startIdx, len = startIdx + length; i < len; i++) {
    const idx = sortSet[i];
    const leafRow = leafRows[idx];
    let target = groups;
    let targetKey;
    let key;
    for (let level = 0; level < levels; level++) {
      const [colIdx] = groupby[level];
      key = leafRow[colIdx];
      targetKey = target[key];
      if (targetKey && level === lastLevel) {
        targetKey.push(idx);
      } else if (targetKey) {
        target = targetKey;
      } else if (!targetKey && level < lastLevel) {
        target = target[key] = {};
      } else if (!targetKey) {
        target[key] = [idx];
      }
    }
  }
  return groups;
}
function splitGroupsAroundDoomedGroup(groupby, doomed) {
  const lastGroupIsDoomed = doomed === 1;
  const doomedIdx = groupby.length - doomed;
  const preDoomedGroupby = [];
  const postDoomedGroupby = [];
  groupby.forEach((col, i) => {
    if (i < doomedIdx) {
      preDoomedGroupby.push(col);
    } else if (i > doomedIdx) {
      postDoomedGroupby.push(col);
    }
  });
  return [lastGroupIsDoomed, preDoomedGroupby, postDoomedGroupby];
}
function decrementDepth(depth) {
  return (Math.abs(depth) - 1) * (depth < 0 ? -1 : 1);
}
function incrementDepth(depth) {
  return (Math.abs(depth) + 1) * (depth < 0 ? -1 : 1);
}
function indexGroupedRows(groupedRows) {
  const Fields = {
    Depth: 1,
    Key: 4
  };
  const groupedIndex = {};
  const levels = [];
  const COLLAPSED = -1;
  for (let idx = 0; idx < groupedRows.length; idx++) {
    let row = groupedRows[idx];
    let rowDepth = row[Fields.Depth];
    if (rowDepth === 0) {
      let index = [idx];
      levels.forEach((level) => {
        index.push(level[1], COLLAPSED);
      });
      groupedIndex[row[Fields.Key]] = index;
    } else {
      while (levels.length && Math.abs(levels[levels.length - 1][0]) <= Math.abs(rowDepth)) {
        levels.pop();
      }
      levels.push([rowDepth, idx]);
    }
  }
  return groupedIndex;
}
function findAggregatedColumns(columns, columnMap, groupby) {
  return columns.reduce((aggregations, column) => {
    if (column.aggregate && indexOfCol(column.name, groupby) === -1) {
      const key = columnMap[column.name];
      aggregations.push([key, column.aggregate]);
    }
    return aggregations;
  }, []);
}
function aggregateGroup(groups, grpIdx, sortSet, rows, columns, aggregations) {
  const { DEPTH, COUNT } = metaData(columns);
  const groupRow = groups[grpIdx];
  let depth = groupRow[DEPTH];
  let absDepth = Math.abs(depth);
  let count = 0;
  let idx = grpIdx;
  while (idx < groups.length - 1 && Math.abs(groups[idx + 1][DEPTH]) < absDepth) {
    idx += 1;
    count += 1;
  }
  for (let i = grpIdx + count; i >= grpIdx; i--) {
    for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
      const [colIdx] = aggregations[aggIdx];
      groups[i][colIdx] = 0;
    }
    aggregate(groups[i], groups, sortSet, rows, columns, aggregations, groups[i][COUNT]);
  }
}
function aggregate(groupRow, groupRows2, sortSet, rows, columns, aggregations, leafCount, filter = null) {
  const { DEPTH, COUNT, FILTER_COUNT } = metaData(columns);
  const { IDX_POINTER } = metaData(columns);
  let absDepth = Math.abs(groupRow[DEPTH]);
  let count = 0;
  let filteredCount = filter === null ? void 0 : 0;
  if (absDepth === 1) {
    let start = groupRow[IDX_POINTER];
    let end = start + leafCount;
    count = leafCount;
    for (let i = start; i < end; i++) {
      const row = rows[sortSet[i]];
      const included = filter === null || filter(row);
      if (filter && included) {
        filteredCount += 1;
      }
      if (filter === null || included) {
        for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
          const [colIdx] = aggregations[aggIdx];
          groupRow[colIdx] += row[colIdx];
        }
      }
    }
  } else {
    const startIdx = groupRows2.indexOf(groupRow) + 1;
    for (let i = startIdx; i < groupRows2.length; i++) {
      const nestedGroupRow = groupRows2[i];
      const nestedRowDepth = nestedGroupRow[DEPTH];
      const nestedRowCount = nestedGroupRow[COUNT];
      const absNestedRowDepth = Math.abs(nestedRowDepth);
      if (absNestedRowDepth >= absDepth) {
        break;
      } else if (absNestedRowDepth === absDepth - 1) {
        for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
          const [colIdx, method] = aggregations[aggIdx];
          if (method === "avg") {
            groupRow[colIdx] += nestedGroupRow[colIdx] * nestedRowCount;
          } else {
            groupRow[colIdx] += nestedGroupRow[colIdx];
          }
        }
        count += nestedRowCount;
      }
    }
  }
  for (let aggIdx = 0; aggIdx < aggregations.length; aggIdx++) {
    const [colIdx, method] = aggregations[aggIdx];
    if (method === "avg") {
      groupRow[colIdx] = groupRow[colIdx] / count;
    }
  }
  groupRow[COUNT] = count;
  groupRow[FILTER_COUNT] = filteredCount;
}
export {
  GroupIdxTracker,
  GroupRow,
  SimpleTracker,
  adjustGroupIndices,
  adjustLeafIdxPointers,
  aggregateGroup,
  allGroupsExpanded,
  decrementDepth,
  expandRow,
  expanded,
  fillNavSetsFromGroups,
  findAggregatedColumns,
  findDoomedColumnDepths,
  findGroupPositions,
  findSortedCol,
  getCount,
  getDirection,
  getGroupStateChanges,
  groupLeafRows,
  groupRows,
  groupbyExtendsExistingGroupby,
  groupbyReducesExistingGroupby,
  groupbySortReversed,
  incrementDepth,
  indexGroupedRows,
  indexOfCol,
  lowestIdxPointer,
  splitGroupsAroundDoomedGroup,
  updateGroupBy
};
//# sourceMappingURL=groupUtils.js.map
