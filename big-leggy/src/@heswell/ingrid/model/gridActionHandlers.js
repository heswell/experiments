import * as Grid from './constants';
import {Selection} from '../types';
import {getFormatter} from '../registry/dataTypeRegistry';
import { groupHelpers, ASC, DSC, sortUtils } from '../../data';
// will have to be mocked for testing
import {getColumnWidth} from '../utils/domUtils';

const DEFAULT_PRESENTER = getFormatter();
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
const handlers = {
    [Grid.INITIALIZE]: init,
    [Grid.ROWCOUNT]: setRowCount,
    [Grid.SORT]: sort,
    [Grid.FILTER]: applyFilter,
    [Grid.SORT_GROUP]: sortGroup,
    [Grid.GROUP]: applyGroup,
    [Grid.COLUMN_RESIZE_BEGIN]: columnResizeBegin,
    [Grid.GRID_RESIZE]: gridResize,
    [Grid.COLUMN_RESIZE]: columnResize,
    [Grid.GROUP_COLUMN_WIDTH]: groupColumnWidth,
    [Grid.RESIZE_HEADING]: resizeHeading,
    [Grid.COLUMN_RESIZE_END]: columnResizeEnd,
    [Grid.MOVE_BEGIN]: moveBegin,
    [Grid.MOVE]: move,
    [Grid.MOVE_END]: moveEnd,
    [Grid.TOGGLE]: toggle,
    [Grid.SCROLLLEFT]: setScrollLeft,
    [Grid.SCROLL_LEFT]: autoScrollLeft,
    [Grid.SCROLL_RIGHT]: autoScrollRight,
    [Grid.COLUMN_COLLAPSE]: collapseColumn,
    [Grid.COLUMN_EXPAND]: expandColumn,
    [MISSING_TYPE]: MISSING_TYPE_HANDLER
};

export default function handle(state, action){
    return (handlers[action.type] || MISSING_HANDLER)(state, action);
}

export function init(state, action) {
    const {
        width=state.width,
        height=state.height,
        headerHeight=state.headerHeight,
        rowHeight=state.rowHeight,
        minColumnWidth=state.minColumnWidth,
        groupColumnWidth=state.groupColumnWidth,
        columns=state.columns,
        columnMap=state.columnMap,
        sortBy=state.sortBy,
        groupBy=state.groupBy,
        groupState=state.groupState,
        filter=state.filter,
        rowCount=state.rowCount,
        scrollbarSize=state.scrollbarSize,
        collapsedColumns=state.collapsedColumns,
        selectionModel=state.selectionModel
    } = action.gridState;

    const preCols = selectionModel === Selection.Checkbox
        ? [{name: '', width: 25, sortable: false, type: {name: 'checkbox', renderer: {name: 'selection-checkbox'}}}]
        :EMPTY_ARRAY;

    const _columns = preCols.concat(columns.map(toColumn));

    const [_groups, _headingDepth] = splitIntoGroups(_columns, sortBy, groupBy || [], collapsedColumns, minColumnWidth);
    // problem, this doesn't account for width of grouped cols, as we do it on the raw columns
    const _totalColumnWidth = sumWidth(_columns, minColumnWidth);
    const displayWidth = getDisplayWidth(height-headerHeight, rowHeight*rowCount, width, _totalColumnWidth, scrollbarSize);

    const totalColumnWidth = measure(_groups, displayWidth, minColumnWidth, groupColumnWidth);

    return {...state, width, height, headerHeight, rowHeight, rowCount, minColumnWidth,
        columns, columnMap, sortBy, groupBy, groupState, collapsedColumns, filter, selectionModel,
        _headingDepth, _columns, _groups, totalColumnWidth, displayWidth};
}

function setRowCount(state, {rowCount}) {
    const {height, headerHeight,rowHeight,width,totalColumnWidth,scrollbarSize} = state;
    const displayWidth = getDisplayWidth(height-headerHeight, rowHeight*rowCount, width, totalColumnWidth, scrollbarSize);

    if (displayWidth === state.displayWidth){
        return { ...state, rowCount };
    } else {
        return init(state, {gridState: {rowCount}});
    }
}

function sort(state, {column, direction, preserveExistingSort}) {
    const newSortCriteria = [[column.name, direction || (column.sorted === 1 ? DSC : ASC)]];
    const sortBy = state.sortBy === null || preserveExistingSort !== true
        ? newSortCriteria
        : state.sortBy.concat(newSortCriteria);

    return init(state, {gridState: {sortBy}});
}

// This will cause entire grid to re-render when only headings need to,
// might consider storing sort/filter separately
function applyFilter(state, {filter}) {
    return {...state, filter};
}

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

            return init(state, {gridState: {groupBy}});
        }
    }
    return state;
}

function applyGroup(state, {groupBy,rowCount=state.rowCount}) {
    return init(state, {gridState: {groupBy,rowCount}});
}

// do we need ?
function toggle(state, {groupState}) {
    return {...state, groupState};
    //return setRowCount({...state, groupState},{rowCount});

}

const splitKeys = compositeKey => compositeKey.split(':').map(k => parseInt(k,10));

function columnResizeBegin(state, {column}) {
    const {updatedGroups: _groups} = column.isHeading
        ? updateGroupHeading(state._groups, column, RESIZING,RESIZING,RESIZING)
        : updateGroupColumn(state._groups, column, RESIZING);

    let _headingResize = column.isHeading
        ? {lastSizedCol: 0, ...getColumnPositions(_groups, splitKeys(column.key))}
        : undefined;

    return {...state, _groups, _headingResize};
}

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

function gridResize(state, {width,height}) {
    return init(state, {gridState: {width,height}});
}

// called as a one-off rather than continuous resize, e.g. for grouped column
function groupColumnWidth(state, {/*column, */width}){
    return init(state, {gridState: {groupColumnWidth: width}});
}

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

function setScrollLeft(state, {scrollLeft}) {
    return {...state,scrollLeft};
}

function autoScrollLeft(state, {scrollDistance}) {
    const scrollLeft = Math.max(state.scrollLeft + scrollDistance, 0);
    if (scrollLeft === state.scrollLeft){
        return state;
    } else {
        const column = state._movingColumn;
        const _virtualLeft = column.left + scrollLeft;
        const _movingColumn = {...column, _virtualLeft};
        return _updateColumnPosition({...state, scrollLeft,_movingColumn}, column);
    }
}

function autoScrollRight(state, {scrollDistance}) {
    const maxScroll = state.totalColumnWidth - state.displayWidth;
    const scrollLeft = Math.min(state.scrollLeft + scrollDistance, maxScroll);
    if (scrollLeft === state.scrollLeft){
        return state;
    } else {
        const column = state._movingColumn;
        const _virtualLeft = column.left + scrollLeft;
        const _movingColumn = {...column, _virtualLeft};
        return _updateColumnPosition({...state, scrollLeft,_movingColumn}, column);
    }
}

function moveBegin(state, {column, scrollLeft=0}) {
    const _virtualLeft = getColumnLeft(state._groups,column);
    const left = _virtualLeft - scrollLeft;
    const moveBoundaries = getColumnMoveBoundaries(state._groups);
    const {updatedGroups: _groups, groupIdx, groupColIdx} = replaceGroupColumn(state._groups,column,{ key: 'move-target', isPlaceHolder: true, width: column.width });
    const _movingColumn = {...column, moving: true,left,_virtualLeft,moveBoundaries,groupIdx,groupColIdx};
    return {...state, _groups, _movingColumn, _columnDragPlaceholder: {groupIdx, groupColIdx}, scrollLeft};
}

function move(state, {distance, scrollLeft=0}) {
    const column = state._movingColumn;    
    const oldPosLeft = column.left;
    const canScroll = state.displayWidth < state.totalColumnWidth;
    // const farRight = state.totalColumnWidth - column.width;
    // const newPosLeft = Math.min(Math.max(0,oldPosLeft + distance), farRight);
    // TODO take current scroll position into account when determining farRight
    const farLeft = scrollLeft === 0 ? 0 : -MAX_OVER_THE_LINE;
    const rightLine = state.displayWidth - column.width;
    const farRight = rightLine + (canScroll ? MAX_OVER_THE_LINE : 0);
    const newPosLeft = Math.min(farRight, Math.max(farLeft, oldPosLeft + distance));
    // If we slip furthar than farLeft or farRight, we need to capture mouse position  

    //TODO calculate the virtual position as well as the actual position   
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

function collapseColumn(state, {column}) {
    const collapsedColumns = state.collapsedColumns === null
        ? [column.label]
        : state.collapsedColumns.concat(column.label);

    return init(state, {gridState: {collapsedColumns}});
}

function expandColumn(state, {column}) {
    const updatedCollapsedColumns = state.collapsedColumns.filter(name => name !== column.label);
    const collapsedColumns = updatedCollapsedColumns.length === 0
        ? null
        : updatedCollapsedColumns;

    return init(state, {gridState: {collapsedColumns}});
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


// TODO missing presenter/formatter etc details
function toColumn(column, idx) {
    //TODO roll cellCSS into className

    // >>>>> Don't like rolling functions into model, think about this
    if (typeof column === 'string') {
        return { key: idx + 4, name: column, formatter: DEFAULT_PRESENTER.formatter};
    } else {
        // type is not sufficient, need to look at formatting metadata
        const presenter = getFormatter(column.type);
        return { 
            ...column, 
            key: idx + 4,
            label: column.heading 
                ? Array.isArray(column.heading) ? column.heading[0] : column.heading
                : column.name,
            formatter: presenter.formatter, 
            cellCSS: presenter.cellCSS(column.type)            
        };
    }
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

        if (colHeaderLabel){

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

function endsWith(string, subString){
    const str = typeof string === 'string'
        ? string
        : string.toString();
    
    return subString.length >= str.length
        ? false
        : str.slice(-subString.length) === subString;    

}

function splitIntoGroups(columns, sortBy=null, groupBy=null, collapsedColumns=null, minColumnWidth) {
    const sortMap = sortUtils.sortByToMap(sortBy);
    const groupByCount = groupBy === null ? 0 : groupBy.length;
    const groups = [];
    const maxHeadingDepth = Math.max(...columns.map(({heading}) => Array.isArray(heading) ? heading.length: 1));

    let group = null;
    let groupCols = [];

    for (let i = 0; i < columns.length; i++) {
        const {key: columnKey, name, locked=false} = columns[i];
        const groupByIdx = groupHelpers.indexOfCol(name, groupBy);

        if (group === null || group.locked !== locked) {
            const headings = maxHeadingDepth > 1 ? [] : undefined;
            groups.push(group = { locked, columns: [], headings, width:0, renderWidth:0, renderLeft:0 });
        }

        // TODO for each collapsed heading, insert a placeholder
        if (groupByIdx === -1) {
            const sorted = sortMap[name];
            addColumnToHeadings(maxHeadingDepth, columns[i], group.headings, collapsedColumns);
            let hidden = false;
            if (group.headings){
                const lastColHeaders = group.headings.map(heading => heading[heading.length-1]);
                const collapsedHeading = lastColHeaders.find(header => header.collapsed);
                hidden = !!collapsedHeading;
                if (collapsedHeading && collapsedHeading.key === columnKey){
                    group.columns.push({ key: collapsedHeading.key, isPlaceHolder: true, width: 25 });
                }
            }
            group.columns.push({ ...columns[i], sorted, hidden });
          
        } else {
            let groupLevel = groupByCount - groupByIdx;
            const [, sortDirection] = groupBy[groupByIdx];
            const sorted = sortDirection === ASC ? 1 : -1;
            groupCols[groupByIdx] = { ...columns[i], sorted, groupLevel };
        }
    }

    if (groupByCount) {
        // TODO make sure we found all the groupBy cols in the columns
        groups[0].columns.unshift({
            key: -1,
            name: 'group-col',
            isGroup: true,
            columns: groupCols,
            width: Math.max(...groupCols.map(col => col.width || minColumnWidth)) + 50
        });
    }

    return [groups, maxHeadingDepth];
}

function measure(groups, displayWidth, minColumnWidth, groupColumnWidth) {

    const columns = flatMap(groups);
    const [firstColumn] = columns;
    if (groupColumnWidth && firstColumn.isGroup) {
        firstColumn.width = Math.max(
            groupColumnWidth === 'auto' ? getColumnWidth(firstColumn) : groupColumnWidth,
            firstColumn.width);
    }

    const [unsizedCols, sizedCols] = partition(columns, col => col.width === undefined, col => !col.hidden);
    let totalColumnWidth = sumWidth(sizedCols);
    const defaultCount = columns.length - sizedCols.length;
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
