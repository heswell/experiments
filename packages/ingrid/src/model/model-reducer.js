// @ts-check
/** @typedef {import('./model').GridModel} GridModel  */
/** @typedef {import('./model').GridModelReducer} GridModelReducer  */
/** @typedef {import('./model').ReducerTable} ReducerTable  */

import {buildColumnMap, metaData, toKeyedColumn} from '@heswell/utils'
import {groupHelpers, ASC, DSC, sortUtils, arrayUtils} from '@heswell/data'
import * as Action from './actions';
import {Selection} from '../types';
// will have to be mocked for testing
import {getColumnWidth} from '../utils/domUtils';

/** @type {GridModelReducer} */
export default (state, action) => (handlers[action.type] || MISSING_HANDLER)(state, action);


/** @type  {GridModel} */
export const DEFAULT_MODEL_STATE = {
    availableColumns: [],
    columnMap: undefined,
    columns: [],
    width: 400,
    height: 300,
    headerHeight: 25,
    rowHeight: 23,
    minColumnWidth: 80,
    groupColumnWidth: 'auto',
    // Note: values which have never been set are undefined, once set, they are unset to null
    sortBy: undefined,
    groupBy: undefined,
    groupState: undefined,
    rowCount: 0,
    rowStripes: false,
    scrollbarSize: 15,
    scrollLeft: 0,
    collapsedColumns: null,

    displayWidth: 400,
    totalColumnWidth: 0,
    selectionModel: Selection.MultipleRow,

    meta: null,

    _movingColumn: null,
    _groups: null,
    _overTheLine: 0,
    _columnDragPlaceholder: null,
    _headingDepth: 1,
    _headingResize: undefined
};

const RESIZING = {resizing: true};
const NOT_RESIZING = {resizing: false};
const EMPTY_ARRAY = [];

const MISSING_HANDLER = (state, action) => {
    console.warn(`gridActionHandlers. No handler for action.type ${action.type}`);
    return state;
};

const MISSING_TYPE_HANDLER = (state) => {
    console.warn(`gridActionHandlers. Invalid action:  missing attribute 'type'`);
    return state;
};

const MAX_OVER_THE_LINE = 20;

const MISSING_TYPE = undefined;

/** @type {ReducerTable} */
const handlers = {
    [Action.INITIALIZE]: initialize,
    [Action.SUBSCRIBED]: subscribed,
    [Action.ROWCOUNT]: setRowCount,
    [Action.SORT]: sort,
    [Action.SORT_GROUP]: sortGroup,
    [Action.GROUP]: setGroupBy,
    [Action.groupExtend]: extendGroup,
    [Action.COLUMN_RESIZE_BEGIN]: columnResizeBegin,
    [Action.GRID_RESIZE]: gridResize,
    [Action.COLUMN_RESIZE]: columnResize,
    [Action.GROUP_COLUMN_WIDTH]: groupColumnWidth,
    [Action.RESIZE_HEADING]: resizeHeading,
    [Action.COLUMN_RESIZE_END]: columnResizeEnd,
    [Action.MOVE_BEGIN]: moveBegin,
    [Action.MOVE]: move,
    [Action.MOVE_END]: moveEnd,
    [Action.TOGGLE]: toggle,
    // [Action.SCROLLLEFT]: setScrollLeft,
    [Action.SCROLL_LEFT]: autoScrollLeft,
    [Action.SCROLL_RIGHT]: autoScrollRight,
    [Action.COLUMN_COLLAPSE]: collapseColumn,
    [Action.COLUMN_EXPAND]: expandColumn,
    [Action.COLUMNS_CHANGE]: columnsChange,
    [MISSING_TYPE]: MISSING_TYPE_HANDLER
};

export const initModel = model => {
    return initialize(DEFAULT_MODEL_STATE, {type: Action.INITIALIZE, gridState: model})
}

/** @type {GridModelReducer} */
function initialize(state, action) {
    const {
        collapsedColumns=state.collapsedColumns,
        columns=state.columns,
        columnMap=null,
        groupBy=state.groupBy,
        groupColumnWidth=state.groupColumnWidth,
        groupState=state.groupState,
        height=state.height,
        headerHeight=state.headerHeight,
        minColumnWidth=state.minColumnWidth,
        rowCount=0,
        rowHeight=state.rowHeight,
        rowStripes=state.rowStripes,
        scrollbarSize=state.scrollbarSize,
        sortBy=state.sortBy,
        selectionModel=state.selectionModel,
        width=state.width,
    } = action.gridState;

    const CHECKBOX_COLUMN = {name: '', key: -1, width: 25, sortable: false, type: {name: 'checkbox', renderer: {name: 'selection-checkbox'}}};

    const preCols = selectionModel === Selection.Checkbox
        ? [CHECKBOX_COLUMN]
        :EMPTY_ARRAY;

    const keyedColumns = columns.map(toKeyedColumn)
    const _columns = preCols.concat(keyedColumns.map(addLabel));

    const {_groups, _headingDepth} = splitIntoGroups(_columns, sortBy, groupBy, collapsedColumns, minColumnWidth);
    // problem, this doesn't account for width of grouped cols, as we do it on the raw columns
    const _totalColumnWidth = sumWidth(_columns, minColumnWidth);

    // we're trying to avoid having to store rowCount (and therefore issuing a new model every time rowCount
    // changes, rather than just when displayWidth changes to allow for scrollbar)
    // TODO we also need to check rowHeight, headerHeight, _totalColumnWidth - which may affect horizontal scrollbar)
    const displayWidth = width !== state.width || height !== state.height || rowCount !== 0
        ? getDisplayWidth(height-headerHeight, rowHeight*rowCount, width, _totalColumnWidth, scrollbarSize)
        : state.displayWidth;

    const totalColumnWidth = measure(_groups, displayWidth, minColumnWidth, groupColumnWidth);

    const map = columnMap === null || columns !== state.columns
        ? buildColumnMap(columns)
        : columnMap;

    return {
        ...state,
        width,
        height,
        headerHeight,
        rowHeight,
        rowStripes,
        minColumnWidth,
        meta: metaData(columns),
        columns: keyedColumns,
        columnMap: map,
        sortBy,
        groupBy,
        groupState,
        collapsedColumns,
        selectionModel,
        _headingDepth,
        _groups,
        totalColumnWidth,
        displayWidth
    };
}

function columnsChange(state, action){
    return initialize(state, {gridState: {columns: action.columns}});
}

function subscribed(state, action){
    if (state.columns.length === 0){
        return initialize(state, {gridState: {columns: action.columns}});
    } else {
        return state;
    }
}

/** @type {GridModelReducer} */
function setRowCount(state, {rowCount}) {
    const {height, headerHeight,rowHeight,width,totalColumnWidth,scrollbarSize} = state;
    const displayWidth = getDisplayWidth(height-headerHeight, rowHeight*rowCount, width, totalColumnWidth, scrollbarSize);
    if (displayWidth === state.displayWidth){
        return state;
    } else {
        return initialize(state, {gridState: {rowCount}});
    }
}

/** @type {GridModelReducer} */
function sort(state, {column, direction, preserveExistingSort=false}) {
    const newSortCriteria = [[column.name, direction || (column.sorted === 1 ? DSC : ASC)]];
    const sortBy = state.sortBy === null || preserveExistingSort !== true
        ? newSortCriteria
        : state.sortBy.concat(newSortCriteria);

    // be careful - re-assigns keys to columns
    return initialize(state, {gridState: {sortBy}});
}

/** @type {GridModelReducer} */
function sortGroup(state, {column}) {
    const {groupBy: existingGroupBy} = state;
    if (existingGroupBy) {
        const groupIdx = groupHelpers.indexOfCol(column.name, existingGroupBy);
        if (groupIdx !== -1){
            const [colName, sortDirection] = existingGroupBy[groupIdx];
            const sortCol = sortDirection === ASC
                ? [colName, DSC]
                : [colName, ASC];

            const groupBy = existingGroupBy.map((groupCol,i) => i === groupIdx
                ? sortCol
                : groupCol);

            return initialize(state, {gridState: {groupBy}});
        }
    }
    return state;
}

/** @type {GridModelReducer} */
function extendGroup(state, {column, rowCount=state.rowCount}) {
    const groupBy = groupHelpers.updateGroupBy(state.groupBy, column);
    return initialize(state, {gridState: {groupBy, rowCount}});
}

/** @type {GridModelReducer} */
function setGroupBy(state, {column, rowCount=state.rowCount}) {
    const groupBy = [[column.name, ASC]];
    return initialize(state, {gridState: {groupBy, rowCount}});
}

/** @type {GridModelReducer} */
function toggle(state, {groupRow}) {
    const groupState = toggleGroupState(groupRow, state)
    return {...state, groupState};
}

function toggleGroupState(groupedRow, model) {

    let { columns, columnMap, groupBy, groupState, meta } = model;
    const groupLevel = groupedRow[meta.DEPTH];
    const groupByIdx = groupBy.length - Math.abs(groupLevel);

    const newGroupState = groupState === null ? {} : { ...groupState };
    let stateEntry = newGroupState;

    for (let i = 0; i <= groupByIdx; i++) {
        const [groupCol] = groupBy[i];
        const column = columns.find(col => col.name === groupCol);
        const key = columnMap[column.name];
        const groupVal = groupedRow[key];

        if (i === groupByIdx) {
            if (stateEntry[groupVal]) {
                stateEntry[groupVal] = null;
            } else {
                stateEntry[groupVal] = i === groupBy.length - 1 ? true : {};
            }
        } else if (stateEntry[groupVal] === true) {
            stateEntry = stateEntry[groupVal] = {};
        } else {
            // clone as we descend
            stateEntry = stateEntry[groupVal] = { ...stateEntry[groupVal] };
            if (!stateEntry) {
                console.log(`Grid.toggleGroup something is wrong - trying to toggle a node whose parent is not expanded`);
                return;
            }
        }
    }

    return newGroupState;

}

const splitKeys = compositeKey => `${compositeKey}`.split(':').map(k => parseInt(k,10));

/** @type {GridModelReducer} */
function columnResizeBegin(state, {column}) {
    const {updatedGroups: _groups} = column.isHeading
        ? updateGroupHeading(state._groups, column, RESIZING,RESIZING,RESIZING)
        : updateGroupColumn(state._groups, column, RESIZING);

    let _headingResize = column.isHeading
        ? {lastSizedCol: 0, ...getColumnPositions(_groups, splitKeys(column.key))}
        : undefined;

    return {...state, _groups, _headingResize};
}

/** @type {GridModelReducer} */
function resizeHeading(state, {column, width}) {
    if (width === column.width){
        return state;
    } else {
        const diff = width - column.width;
        const {lastSizedCol: pos, groupIdx, groupColIdx} = state._headingResize;
        const [lastSizedCol,diffs] = getColumnAdjustments(pos,groupColIdx.length,diff);
        const _headingResize = {lastSizedCol, groupIdx, groupColIdx};
        let newState = state;
        for (let i=0;i<diffs.length;i++){
            if (typeof diffs[i] === 'number'){
                const targetCol = state._groups[groupIdx].columns[groupColIdx[i]];
                newState = columnResize({...newState, _headingResize}, {column: targetCol, width: targetCol.width + diffs[i]});
            }
        }
        return newState;
    }
}

function getColumnAdjustments(pos, numCols, diff){
    const sign = diff < 0 ?-1 : 1;
    const absDiff = diff*sign;
    const numSlotsToFill = Math.min(absDiff,numCols);
    const each = Math.floor(absDiff/numCols);
    let diffs = absDiff % numCols;
    const results = [];

    for (let i=0;i<numSlotsToFill;i++,pos++){
        if (pos === numCols){
            pos = 0;
        }
        results[pos] = sign * (each + (diffs ? 1 : 0));
        if (diffs){
            diffs -=1;
        }
    }
    return [pos, results];
}

/** @type {GridModelReducer} */
function gridResize(state, {width,height}) {
    return initialize(state, {gridState: {width,height}});
}

/** 
 * called as a one-off rather than continuous resize, e.g. for grouped column
 * @type {GridModelReducer}
 */
function groupColumnWidth(state, {/*column, */width}){
    return initialize(state, {gridState: {groupColumnWidth: width}});
}

/** @type {GridModelReducer} */
function columnResize(state, {column, width}) {
    if (column.width <= state.minColumnWidth && width <= column.width) {
        return state;
    }

    const {updatedGroups: _groups, updatedGroup, groupIdx} = updateGroupColumn(state._groups, column, {width});
    updateColumnHeading(updatedGroup);
    const widthAdjustment = width - column.width;
    const totalColumnWidth = state.totalColumnWidth + widthAdjustment;

    if (totalColumnWidth < state.displayWidth) {
        // what do we do about empty space
    }

    updatedGroup.width += widthAdjustment;

    if (updatedGroup.locked) {
        updatedGroup.renderWidth += widthAdjustment;
        for (let i = groupIdx + 1; i < _groups.length; i++) {
            const {locked, renderLeft, renderWidth} = _groups[i];
            _groups[i] = {
                ..._groups[i],
                renderLeft: renderLeft + widthAdjustment,
                renderWidth: locked ? renderWidth : renderWidth - widthAdjustment
            };
        }
    }

    const groupColumnWidth = column.isGroup
        ? width
        : state.groupColumnWidth;

    return {...state, _groups, totalColumnWidth, groupColumnWidth};

}

/** @type {GridModelReducer} */
function columnResizeEnd(state, {column}) {
    const columns = column.isHeading
        ? state.columns // TODO
        : updateColumn(state.columns, column.name, {width: column.width});
    const {updatedGroups: _groups} = column.isHeading
        ? updateGroupHeading(state._groups, column, NOT_RESIZING,NOT_RESIZING,NOT_RESIZING)
        : updateGroupColumn(state._groups, column, NOT_RESIZING);
    const groupColumnWidth = column.isGroup ? column.width : state.groupColumnWidth;
    return {...state, columns, _groups, groupColumnWidth, _headingResize: undefined};
}

// function setScrollLeft(state, {scrollLeft}) {
//     return {...state,scrollLeft};
// }

/** @type {GridModelReducer} */
function autoScrollLeft(state, {scrollDistance}) {
    const {_overTheLine,  _movingColumn: column} = state;

    const scrollLeft = Math.max(state.scrollLeft + scrollDistance, 0);
    if (scrollLeft === state.scrollLeft){
        return _overTheLine === 0
            ? state
            : { ...state, _overTheLine: 0 };
    } else if (column) {
        const _virtualLeft = column.left + scrollLeft;
        const _movingColumn = {...column, _virtualLeft};
        return _updateColumnPosition({...state, scrollLeft,_movingColumn}, column);
    } else {
        return state;
    }
}

/** @type {GridModelReducer} */
function autoScrollRight(state, {scrollDistance}) {
    const {totalColumnWidth, displayWidth, _movingColumn: column, _overTheLine} = state;
    const maxScroll = totalColumnWidth - displayWidth;
    const scrollLeft = Math.min(state.scrollLeft + scrollDistance, maxScroll);
    if (scrollLeft === state.scrollLeft){
        return _overTheLine === 0
            ? state
            : { ...state, _overTheLine: 0 };
    } else if (column) {
        const _virtualLeft = column.left + scrollLeft;
        const _movingColumn = {...column, _virtualLeft};
        return _updateColumnPosition({...state, scrollLeft,_movingColumn}, column);
    } else {
        return state;
    }
}

/** @type {GridModelReducer} */
function moveBegin(state, {column, scrollLeft=0}) {
    const _virtualLeft = getColumnLeft(state._groups,column);
    const left = _virtualLeft - scrollLeft;
    const moveBoundaries = getColumnMoveBoundaries(state._groups);
    const {updatedGroups: _groups, groupIdx, groupColIdx} = replaceGroupColumn(state._groups,column,{ 
        key: 'move-target',
        isPlaceHolder: true, 
        width: column.width
    });

    const _movingColumn = {...column, moving: true,left,_virtualLeft,moveBoundaries,groupIdx,groupColIdx};
    return {...state, _groups, _movingColumn, _columnDragPlaceholder: {groupIdx, groupColIdx}, scrollLeft};
}

/** @type {GridModelReducer} */
function move(state, {distance, scrollLeft=0}) {
    const column = state._movingColumn;    
    const oldPosLeft = column.left;
    const canScroll = state.displayWidth < state.totalColumnWidth;

    // TODO take current scroll position into account when determining farRight
    const farLeft = scrollLeft === 0 ? 0 : -MAX_OVER_THE_LINE;
    const rightLine = state.displayWidth - column.width;
    const farRight = rightLine + (canScroll ? MAX_OVER_THE_LINE : 0);
    const newPosLeft = Math.min(farRight, Math.max(farLeft, oldPosLeft + distance));
    // If we slip furthar than farLeft or farRight, we need to capture mouse position  

    const _movingColumn = {...column, left: newPosLeft, _virtualLeft: newPosLeft + scrollLeft};
    const overTheLineLeft = newPosLeft < 0;
    const overTheLineRight = newPosLeft > rightLine;
    const _overTheLine =
        overTheLineLeft
            ? newPosLeft
            : overTheLineRight
                ? newPosLeft - rightLine
                : 0;

    return _updateColumnPosition({...state, _overTheLine, _movingColumn},column);
}

/** @type {GridModelReducer} */
function collapseColumn(state, {column}) {
    const collapsedColumns = state.collapsedColumns === null
        ? [column.label]
        : state.collapsedColumns.concat(column.label);

    return initialize(state, {gridState: {collapsedColumns}});
}

/** @type {GridModelReducer} */
function expandColumn(state, {column}) {
    const updatedCollapsedColumns = state.collapsedColumns.filter(name => name !== column.label);
    const collapsedColumns = updatedCollapsedColumns.length === 0
        ? null
        : updatedCollapsedColumns;

    return initialize(state, {gridState: {collapsedColumns}});
}

// This function manipulates state without cloning - it is an internal function called on 
// an already transformed state object to perform additional transformation. 
function _updateColumnPosition(state,prevColumn) {

    const column = state._movingColumn;
    const { left: positionsLeft, right: positionsRight } = column.moveBoundaries;
    const { groupColIdx: columnPosition } = column;

    let insertionIdx = -1;
    let insertionGroupIdx = -1;
    let groupColCount = 0;
    let earlierGroupColCount = 0;
    let lastGroup = 0;

    if (prevColumn._virtualLeft > column._virtualLeft) /* moving left */ {
        for (let idx=0,i=0; i < positionsLeft.length && insertionIdx === -1; i+=2, idx++) {
            insertionGroupIdx = positionsLeft[i+1];
            if (insertionGroupIdx !== lastGroup) {
                earlierGroupColCount = groupColCount;
                lastGroup = insertionGroupIdx;
            }
            groupColCount += 1;
            const adjustment = idx > columnPosition ? column.width : 0;
            const position = positionsLeft[i] - adjustment;
            if (prevColumn._virtualLeft >= position && column._virtualLeft < position) {
                insertionIdx = (adjustment ? idx -1 : idx) - earlierGroupColCount;
            }
        }
    } else /* moving right */{
        // TODO need an adjustment if we are dragging from one group to another
        for (let idx=0,i=0; i < positionsRight.length && insertionIdx === -1; i+=2, idx++) {
            insertionGroupIdx = positionsRight[i+1];
            if (insertionGroupIdx !== lastGroup) {
                earlierGroupColCount = groupColCount;
                lastGroup = insertionGroupIdx;
            }
            groupColCount += 1;
            const adjustment = idx < columnPosition ? column.width : 0;
            const position = positionsRight[i] + adjustment;
            if (prevColumn._virtualLeft + prevColumn.width < position && column._virtualLeft+column.width >= position) {
                insertionIdx = (adjustment ? idx+1 : idx) - earlierGroupColCount;
            }
        }

    }

    if (insertionIdx !== -1) {
        const {groupIdx, groupColIdx} = state._columnDragPlaceholder;
        const _columnDragPlaceholder = {groupIdx: insertionGroupIdx, groupColIdx: insertionIdx};
        const {updatedGroups: _groups} = moveGroupColumn(state._groups, groupIdx, groupColIdx, insertionGroupIdx, insertionIdx);  

        return {...state, _groups, _columnDragPlaceholder};
    } else {
        return state;
    }
}

/** @type {GridModelReducer} */
function moveEnd(state, {column}) {
    // eslint-disable-next-line no-unused-vars
    const {groupIdx, groupColIdx,moveBoundaries,left, ...movingColumn} = state._movingColumn;
    const {groupColIdx:finalIdx} = state._columnDragPlaceholder;
    const {updatedGroups:_groups} = replaceGroupColumn(state._groups,{key:'move-target'}, movingColumn);    
    const columns = reorderColumns(state.columns, column, finalIdx);
    replaceColumnHeadings(_groups, state._headingDepth);
    return {...state, columns, _groups, _movingColumn:null, _columnDragPlaceholder:null};
}

function updateColumn(columns, name, updates){
    return columns.map(column => column.name === name
        ? {...column, ...updates}
        : column
    );
}

function reorderColumns(columns, column, idx){
    const from = columns.findIndex(c => c.name === column.name);
    const results = columns.slice();
    const [col] = results.splice(from,1);
    results.splice(idx,0,col);
    return results;
}

function moveGroupColumn(groups, fromGroupIdx, fromColumnIdx, toGroupIdx, toColumnIdx){

    const column = groups[fromGroupIdx].columns[fromColumnIdx];
    const updatedGroups = groups.slice();

    if (fromGroupIdx === toGroupIdx){
        const updatedGroup = cloneGroup(updatedGroups[fromGroupIdx]);
        updatedGroup.columns.splice(fromColumnIdx,1);
        updatedGroup.columns.splice(toColumnIdx,0,column);
        updatedGroups[fromGroupIdx] = updatedGroup;

    } else {
        const shiftLeft = fromGroupIdx > toGroupIdx;
        updatedGroups[fromGroupIdx] = removeColumnFromGroup(updatedGroups[fromGroupIdx],fromColumnIdx,shiftLeft);
        updatedGroups[toGroupIdx] = addColumnToGroup(updatedGroups[toGroupIdx], column, toColumnIdx, shiftLeft);
    }

    return {updatedGroups};        

}

function cloneGroup(group){
    return { ...group, columns: [...group.columns] };
}

function removeColumnFromGroup(group, columnIdx, shiftLeft){
    const updatedGroup = cloneGroup(group);
    const column = updatedGroup.columns[columnIdx];
    updatedGroup.columns.splice(columnIdx,1);
    updatedGroup.width -= column.width;
    updatedGroup.renderWidth -= column.width;
    if (shiftLeft){
        updatedGroup.renderLeft += column.width;
    }
    return updatedGroup;
}

function addColumnToGroup(group, column, columnIdx,shiftLeft){
    const updatedGroup = cloneGroup(group);
    updatedGroup.columns.splice(columnIdx,0,column);
    updatedGroup.width += column.width;
    updatedGroup.renderWidth += column.width;
    if (!shiftLeft){
        updatedGroup.renderLeft -= column.width;
    }
    return updatedGroup;
}

function updateGroupHeading(groups, column, headingUpdates, subHeadingUpdates, columnUpdates){
    const keys = splitKeys(column.key);
    const { groupIdx, groupHeadingIdx, headingColIdx } = getHeadingPosition(groups, column);

    const group = groups[groupIdx];
    const updatedGroup = { ...group, headings: [...group.headings]};

    // 1) Apply changes to the target heading ...
    const heading = updatedGroup.headings[groupHeadingIdx];
    const updatedHeading = [...heading];
    updatedGroup.headings[groupHeadingIdx] = updatedHeading;
    updatedHeading[headingColIdx] = {...column, ...headingUpdates};
    
    // 2) Optionally, apply updates to nested sub-headings ...
    if (subHeadingUpdates){
        for (let i=0;i<groupHeadingIdx;i++){
            const h = updatedGroup.headings[i];
            let updatedH = null;
            for (let j = 0; j < h.length; j++) {
                if (column.key.indexOf(h[j].key) !== -1) {
                    updatedH = updatedH || [...h];
                    updatedH[j] = { ...h[j], ...subHeadingUpdates };
                }
            }
            if (updatedH !== null) {
                updatedGroup.headings[i] = updatedH;
            }
        }
    }

    // 3) Optionally, apply updates to underlying columns ...
    if (columnUpdates){
        const { groupColIdx } = getColumnPositions(groups, keys);
        updatedGroup.columns = [...group.columns];
        groupColIdx.forEach(idx => {
            const updatedColumn = { ...updatedGroup.columns[idx], ...columnUpdates };
            updatedGroup.columns[idx] = updatedColumn;
        });
    }

    const updatedGroups = [...groups];
    updatedGroups[groupIdx] = updatedGroup;
    return {updatedGroups, updatedGroup};

}

function updateGroupColumn(groups, column, updates){
    const { groupIdx, groupColIdx } = getColumnPosition(groups, column);
    const group = groups[groupIdx];
    const updatedGroup = { ...group, columns: [...group.columns] };
    const updatedColumn = { ...column, ...updates };
    updatedGroup.columns[groupColIdx] = updatedColumn;
    const updatedGroups = [...groups];
    updatedGroups[groupIdx] = updatedGroup;
    return {updatedGroups, updatedGroup, updatedColumn, groupIdx, groupColIdx};
}

function replaceGroupColumn(groups, targetColumn, replacementColumn){
    const { groupIdx, groupColIdx } = getColumnPosition(groups, targetColumn);
    const group = groups[groupIdx];
    const updatedGroup = { ...group, columns: [...group.columns] };
    updatedGroup.columns[groupColIdx] = replacementColumn;
    const updatedGroups = [...groups];
    updatedGroups[groupIdx] = updatedGroup;
    return {updatedGroups, updatedGroup, groupIdx, groupColIdx};
}

function getHeadingPosition(groups, column) {
    for (let i = 0; i < groups.length; i++) {
        const {headings=null} = groups[i];
        for (let j=0;headings && j<headings.length;j++){
            const idx = headings[j].findIndex(h => h.key === column.key && h.label === column.label);
            if (idx !== -1) {
                return { groupIdx: i, groupHeadingIdx: j, headingColIdx: idx };
            }
        }

    }
    return { groupIdx: -1, groupHeadingIdx: -1, headingColIdx: -1 };
}

function getColumnPosition(groups, column) {
    for (let i = 0; i < groups.length; i++) {
        const idx = groups[i].columns.findIndex(c => c.key === column.key);
        if (idx !== -1) {
            return { groupIdx: i, groupColIdx: idx };
        }
    }
    return { groupIdx: -1, groupColIdx: -1 };
}

const columnKeysToIndices = (keys,columns) =>
    keys.map(key => columns.findIndex(c => c.key === key));

const columnKeysToColumns = (keys,columns) =>
    keys.map(key => columns.find(c => c.key === key));

function getColumnPositions(groups, keys) {
    for (let i = 0; i < groups.length; i++) {
        const indices = columnKeysToIndices(keys, groups[i].columns);
        if (indices.every(key => key !== -1)) {
            return { groupIdx: i, groupColIdx: indices };
        }
    }
    return { groupIdx: -1, groupColIdx: [] };
}


function addLabel(column) {
    const {name, label=name} = column;
    return { 
        ...column, 
        label: column.heading 
            ? Array.isArray(column.heading) ? column.heading[0] : column.heading
            : label
    };
}

const getWidth = minWidth => column => Math.max(column.width || 0, minWidth);
const add = (val1, val2) => val1 + val2;
function sumWidth(list, minWidth = 0) {
    return list.length === 0 ? 0 : list.map(getWidth(minWidth)).reduce(add);
}

function updateColumnHeading(group){
    if (group.headings){
        const columns = group.columns;
        group.headings = group.headings.map(heading => heading.map(colHeading => {
            const indices = columnKeysToIndices(splitKeys(colHeading.key),columns);
            const colWidth = indices.reduce((sum, idx) => sum + (columns[idx].width), 0);
            return colWidth === colHeading.width 
                ? colHeading
                : {...colHeading, width: colWidth};
        }));
    }
}

function replaceColumnHeadings(groups,maxHeadingDepth){

    if (maxHeadingDepth > 1){
        groups.forEach(group => {
            const headings = [];
            group.columns.forEach(column => {
                addColumnToHeadings(maxHeadingDepth, column, headings);
            });
            group.headings = headings;
        });
    }

    return maxHeadingDepth;
}

function endsWith(string, subString){
    const str = typeof string === 'string'
        ? string
        : string.toString();
    
    return subString.length >= str.length
        ? false
        : str.slice(-subString.length) === subString;    

}

function splitIntoGroups(columns, sortBy=null, groupBy=EMPTY_ARRAY, collapsedColumns=null, minColumnWidth) {
    const sortMap = sortUtils.sortByToMap(sortBy);
    const groups = [];
    const maxHeadingDepth = columns.length === 0
        ? 0
        : Math.max(...columns.map(({heading}) => Array.isArray(heading) ? heading.length: 1));

    let group = null;

    const [groupColumn, nonGroupedColumns] = extractGroupColumn(columns, groupBy, minColumnWidth);
    if (groupColumn){
        const headings = maxHeadingDepth > 1 ? [] : undefined;
        groups.push(group = { locked: false, columns: [groupColumn], headings, width:0, renderWidth:0, renderLeft:0 });
        addColumnToHeadings(maxHeadingDepth, groupColumn, group.headings);
    }

    for (let i = 0; i < nonGroupedColumns.length; i++) {
        const column = nonGroupedColumns[i];
        const {key: columnKey, name, locked=false} = column;

        if (group === null || group.locked !== locked) {
            const headings = maxHeadingDepth > 1 ? [] : undefined;
            groups.push(group = { locked, columns: [], headings, width:0, renderWidth:0, renderLeft:0 });
        }

        // TODO for each collapsed heading, insert a placeholder
        const sorted = sortMap[name];
        addColumnToHeadings(maxHeadingDepth, column, group.headings, collapsedColumns);
        let {hidden} = column;
        if (group.headings){
            const lastColHeaders = group.headings.map(heading => heading[heading.length-1]);
            const collapsedHeading = lastColHeaders.find(header => header.collapsed);
            hidden = hidden || !!collapsedHeading;
            if (collapsedHeading && collapsedHeading.key === columnKey){
                group.columns.push({ key: collapsedHeading.key, isPlaceHolder: true, width: 25 });
            }
        }
        group.columns.push({ ...column, sorted, hidden });
          
    }

    return {_groups: groups, _headingDepth: maxHeadingDepth};
}

function extractGroupColumn(columns, groupBy, minColumnWidth){
    if (groupBy && groupBy.length > 0){
        const isGroup = ({name}) => groupHelpers.indexOfCol(name, groupBy) !== -1
        // Note: groupedColumns will be in column order, not groupBy order
        const [groupedColumns, rest] = arrayUtils.partition(columns, isGroup);
        if (groupedColumns.length !== groupBy.length){
            throw Error(`extractGroupColumn: no column definition found for all groupBy cols ${JSON.stringify(groupBy)} `);
        }
        const groupCount = groupBy.length;
        const groupCols = groupBy.map(([name], idx) => {
            // Keep the cols in same order defined on groupBy
            const column = groupedColumns.find(col => col.name === name);
            return {
                ...column,
                groupLevel: groupCount - idx
            }
        })
        const groupCol = {
            key: -1,
            name: 'group-col',
            isGroup: true,
            columns: groupCols,
            width: Math.max(...groupCols.map(col => col.width || minColumnWidth)) + 50
        };
        return [groupCol, rest];
    }
    return [null, columns]
}

function addColumnToHeadings(maxHeadingDepth, column, headings, collapsedColumns=null){
    const sortable = false;
    const collapsible = true;
    const isHeading = true;

    const {key, heading: colHeader=[column.name], width} = column;
    for (let depth = 1; depth < maxHeadingDepth; depth++) {

        const heading = headings[depth-1] || (headings[depth-1] = []);
        const colHeaderLabel = colHeader[depth];
        const lastHeading = heading.length > 0
            ? heading[heading.length-1]
            : null;

        if (colHeaderLabel !== undefined){

            if (lastHeading && lastHeading.label === colHeader[depth]){
                lastHeading.width += width;
                lastHeading.key += `:${key}`;
            } else {
                const collapsed = collapsedColumns && collapsedColumns.indexOf(colHeaderLabel) !== -1;
                let hide = false;
                if (collapsed){
                    // lower depth headings are subheadings, nested subheadings below a collapsed heading
                    // will be hidden. Q: would it be better to iterate higher to lower ? When we encounter
                    // a collapsed heading for a given column, the first subheading at any lower level 
                    // will already have been created, so we need to hide them.
                    for (let d=0;d<depth-1;d++){
                        const head = headings[d];
                        head[head.length-1].hidden = true;
                    } 

                } else if (depth < maxHeadingDepth-1){
                    // ...likewise if we encounter a subheading, which is not the first for a given
                    // higher -level heading, and that higher-level heading is collapsed, we need to hide it.
                    for (let d=depth;d<maxHeadingDepth;d++){
                        const head = headings[d];
                        const colHeadingLabel = colHeader[d+1];
                        if (head && head.length && colHeaderLabel){
                            const {collapsed: isCollapsed,hidden,label} = head[head.length - 1];
                            if ((isCollapsed || hidden) && label === colHeadingLabel){
                                hide = true;
                            }
                        }
                    } 

                }
                heading.push({key,label: colHeaderLabel,width,sortable,collapsible,collapsed,hidden: hide,isHeading});
            }
        } else {

            const lowerDepth = headings[depth-2];
            const lastLowerDepth = lowerDepth
                ? lowerDepth[lowerDepth.length-1]
                : null;

            if (lastLowerDepth && lastLowerDepth.key === key){
            // Need to check whether a heading at level below is collapsed
                heading.push({key,label: '',width,collapsed: lastLowerDepth.collapsed,sortable,isHeading});
            } else if (lastLowerDepth && endsWith(lastLowerDepth.key,`:${key}`)){
                lastHeading.width += width;
                lastHeading.key += `:${key}`;
            } else {
                heading.push({key,label: '',width,isHeading});
            }
        }
    }

}

function measure(groups, displayWidth, minColumnWidth, groupColumnWidth) {
    if (groups.length === 0){
        return 0;
    }
    const columns = flatMap(groups);
    const [firstColumn] = columns;
    if (groupColumnWidth && firstColumn.isGroup) {
        firstColumn.width = Math.max(
            groupColumnWidth === 'auto' ? getColumnWidth(firstColumn) : groupColumnWidth,
            firstColumn.width);
    }

    const visibleColumns = columns.filter(col => !col.hidden);
    const [unsizedCols, sizedCols] = partition(visibleColumns, col => col.width === undefined, col => !col.hidden);
    let totalColumnWidth = sumWidth(sizedCols);
    const defaultCount = visibleColumns.length - sizedCols.length;
    //TODO pluggable width assignment algo
    // default behaviour - give each columns at least the min col width. If there is surplus space,
    // divide it equally between the no-width columns. (this can leave a remainder)
    const defaultWidth = defaultCount === 0
        ? 0
        : Math.max(Math.floor((displayWidth - totalColumnWidth) / defaultCount), minColumnWidth);
    totalColumnWidth += defaultCount * defaultWidth;
    unsizedCols.forEach(column => column.width = defaultWidth);

    let lockedGroupWidth = 0;
    let scrollGroupWidth = 0;

    //TODO account for collapsed/hidden headings and columns
    groups.forEach(group => {
        group.width = sumWidth(group.columns.filter(col => !col.hidden));
        if (group.locked) {
            lockedGroupWidth += group.width;
        }
        if (group.headings){
            group.headings.forEach(heading =>
                heading.forEach(colHeading => {
                    colHeading.width = sumWidth(columnKeysToColumns(splitKeys(colHeading.key),group.columns).filter(col => !col.hidden));
                }
                ));
        }
    });

    // Note: there is only ever one scrollGroup, can be two locked groups (at either end)
    if (displayWidth - lockedGroupWidth < minColumnWidth) {
        // Locked group consumes too much of available space, not enough room to host the scrolling group(s). 
        // Fall back to single grid-wide scrollbar and no locked groups
        groups = [{ locked: false, width: totalColumnWidth, columns: columns }];
        scrollGroupWidth = displayWidth; // shouldn't this be totalColumnWidth ?
    } else {
        scrollGroupWidth = displayWidth - lockedGroupWidth;
    }

    for (let left = 0, i = 0; i < groups.length; i++) {
        const group = groups[i];
        group.renderLeft = left;
        group.renderWidth = group.locked ? group.width : scrollGroupWidth;
        left += group.renderWidth;
    }

    return totalColumnWidth;

}

function flatMap(groups) {
    let columns = [];
    groups.forEach(group => {
        columns = columns.concat(group.columns);
    });
    return columns;
}

function partition(list, test1, test2=null) {
    const results1 = [];
    const misses = [];
    const results2 = test2===null ? null : [];

    for (let i = 0; i < list.length; i++) {
        if (test1(list[i])) {
            results1.push(list[i]);
        } else if (test2 !== null && test2(list[i])) {    
            results2.push(list[i]);
        } else {
            misses.push(list[i]);
        }
    }

    return test2 === null
        ? [results1, misses]
        : [results1, results2, misses];
}

function getDisplayWidth(clientHeight, contentHeight, width, totalColumnWidth, scrollbarSize) {

    const horizontalScrollbar = scrollbarNeeded(totalColumnWidth, width, scrollbarSize);
    const verticalScrollbar = scrollbarNeeded(contentHeight, clientHeight, scrollbarSize);

    if (verticalScrollbar === 'YES') {
        return width - scrollbarSize;
    } else if (verticalScrollbar === 'NO') {
        return width;
    } else if (horizontalScrollbar === 'NO') {
        return width;
    } else if (horizontalScrollbar === 'YES') {
        return width - scrollbarSize;
    } else if (horizontalScrollbar === 'MAYBE') {
        // is this right ?
        return width - scrollbarSize;
    }

}

function scrollbarNeeded(contentSize, containerSize, scrollbarSize) {
    return contentSize > containerSize ? 'YES' :
        contentSize <= (containerSize - scrollbarSize) ? 'NO' :
            'MAYBE';
}

function getColumnLeft(groups, column) {
    let result = 0;
    for (let i = 0; i < groups.length; i++) {
        const { columns } = groups[i];
        for (let j = 0; j < columns.length; j++) {
            if (columns[j] === column) {
                return result;
            }
            result += columns[j].width;
        }
    }
    return result;
}

// do we need to calculate them all - will it be fast enough to calculate 
// them as we move along the container ?
function getColumnMoveBoundaries(groups) {
    const results = {
        left: [],
        right: []
    };

    let position = 0;

    for (let i = 0; i < groups.length; i++) {
        const { columns } = groups[i];
        for (let j = 0; j < columns.length; j++) {
            results.left.push(position + 20,i);
            position += columns[j].width;
            results.right.push(position - 20,i);
        }
    }
    return results;
}
