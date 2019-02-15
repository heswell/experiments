import {Selection} from '../types';
import * as Grid from './constants';
import handleAction from './gridActionHandlers';

const DEFAULT_STATE = {
    width: 400,
    height: 300,
    headerHeight: 25,
    rowHeight: 23,
    minColumnWidth: 80,
    groupColumnWidth: 'auto',
    columns: [],
    sortBy: null,
    groupBy: null,
    groupState: null,
    filter: null,
    rowCount: 0,
    scrollbarSize: 15,
    scrollLeft: 0,
    collapsedColumns: null,

    displayWidth: 400,
    totalColumnWidth: 0,
    selectionModel: Selection.MultipleRow,

    meta: null,

    _columns: null,
    _columnMap: null,
    _movingColumn: null,
    _groups: null,
    _overTheLine: 0,
    _columnDragPlaceholder: null,
    _headingDepth: 1,
    _headingResize: undefined
};

export default class GridReducer {

    state;

    constructor(gridState){
        this.state = reduce(DEFAULT_STATE, {type: Grid.INITIALIZE, gridState});
    }

    dispatch(action){
        return this.state = reduce(this.state, action);
    }
}

function reduce(state, action) {
    return handleAction(state, action);
}
