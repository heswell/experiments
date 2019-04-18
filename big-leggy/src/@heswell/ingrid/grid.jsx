/*
    why is _scrollLeft set to undefined in both willMount and willUnmount

*/

// TODO calculate width, height if not specified
/*global requestAnimationFrame cancelAnimationFrame */
import React, {useRef, useState, useReducer, useEffect, useCallback} from 'react';
import cx from 'classnames';
import * as Action from './model/constants';
import { Motion, spring } from 'react-motion';
import modelReducer, {init} from './model/modelReducer';
import Header from './header/header';
import ColumnBearer from './core/ColumnBearer';
import InlineFilter from './header/inlineFilter';
import Viewport from './core/viewport';
import {getScrollbarSize, getColumnWidth} from './utils/domUtils';
import { PopupService } from './services';
import GridContextMenu, { ContextMenuActions } from './contextMenu';
import {DataTypes, filter as filterUtils, groupHelpers, columnUtils} from '../data';

import {createLogger, logColor} from '../remote-data/constants';

import './grid.css';

    // static defaultProps = {
    //     style: {},
    //     selected: [],
    //     headerHeight: 24,
    //     rowHeight: 23,
    //     minColumnWidth: 80,
    //     onContextMenu: () => { },
    //     showFilters: false
    // };

const logger = createLogger('Grid', logColor.green)

const scrollbarSize = getScrollbarSize();

const reducer = ({data, model}, action) => {

    if (action.type === 'data'){
        const {rows, rowCount} = action;
        return { 
            data: { rows, rowCount, selected: [] }, 
            model: rowCount === data.rowCount
                ? model
                : modelReducer(model, { type: Action.ROWCOUNT, rowCount })
        }
    } else {
        return {
            data,
            model: modelReducer(model, action)
        }
    }
}

const Grid = (props) => {

    let { dataView, columns } = props;
    const { columnMap } = dataView;

    const header = useRef(null);
    const viewport = useRef(null);
    // const inlineFilter = useRef(null);
    
    const [state, setState] = useState({
        showFilters: props.showFilters || false,
        groupToggled: false

    });

    let _scrollLeft = undefined;
    let _scrollTimer = null;

    const [{model, data}, dispatch] = useReducer(reducer, {
        model: {
        ...props,
        columns: columns.map(columnUtils.toKeyedColumn),
        columnMap,
        scrollbarSize,
        headerHeight: props.showHeaders === false ? 0 : props.headerHeight
        },
        data: {
            rows: [],
            rowCount: 0,
            selected: []
        }
    }, init);

    const { height, width, headerHeight, _headingDepth, sortBy } = model;

    useEffect(() => {
        logger.log('<call dataView.subscribe>')
        dataView.subscribe(columns, (msgType, rows, rowCount=null) => {
            // maybe we should be setting rows and length in state
            logger.log(`<${msgType}> rowCount=${rowCount}`);
            // const {IDX, SELECTED} = model.meta;
            dispatch({ type: 'data', rows, rowCount })
    
            // if (this.state.groupToggled && rowCount !== 0){
            //     // is this necessary every time ?
            //     const [group] = model._groups;
            //     const [column] = group.columns;
            //     const width = getColumnWidth(column);
            //     dispatch({ type: Action.GROUP_COLUMN_WIDTH, column, width });
            //     state.groupToggled = false;
            // }
    
        });

        // TODO how do we manage this 
        dataView.setRange(0, 25, false);

    },[dataView]);

    useEffect(() => dataView.sort(sortBy), [dataView, sortBy])



        const { showFilters, /*selected*/ } = state;
        const { style, selectionDefault } = props;
        const isEmpty = dataView.size <= 0;
        const emptyDisplay = (isEmpty && props.emptyDisplay) || null;
        const className = cx(
            'Grid',
            props.className,
            emptyDisplay ? 'empty' : '',
            isEmpty && props.showHeaderWhenEmpty === false ? 'no-header' : ''
        );

        const filterHeight = showFilters ? 24 : 0;
        const showHeaders = props.showHeaders !== false && headerHeight !== 0;
        const headingHeight = showHeaders ? headerHeight * _headingDepth : 0;
        const totalHeaderHeight = headingHeight + filterHeight;

        const sort = useCallback((column, direction = null, preserveExistingSort = false) => {
            // this will transform the columns which will cause whole grid to re-render down to cell level. All
            // we really need if for headers to rerender. SHould we store sort criteria outside of columns ?
            dispatch({ type: Action.SORT, column, direction, preserveExistingSort });
            viewport.current.setScroll(0);
        },[dispatch])

        const setViewRange = useCallback((firstVisibleRow, lastVisibleRow, initialRange=false) => {
            const sendDelta = initialRange === false;
            dataView.setRange(firstVisibleRow, lastVisibleRow, sendDelta);
        },[dataView])

        const handleColumnResize = useCallback((phase, column, width) => {
            if (phase === 'resize') {
                if (column.isHeading) {
                    dispatch({ type: Action.RESIZE_HEADING, column, width });
                } else {
                    // TODO do we need to consider scrolling ?
                    dispatch({ type: Action.COLUMN_RESIZE, column, width });
                }
            } else if (phase === 'begin') {
                dispatch({ type: Action.COLUMN_RESIZE_BEGIN, column }) ;
            } else if (phase === 'end') {
                dispatch({ type: Action.COLUMN_RESIZE_END, column });
            }
        },[dispatch])

        //TODO if we can pass the required data back with the request, we won't need to embed this callback
        const showContextMenu = useCallback((e, location, options) => {

            e.preventDefault();
            e.stopPropagation();
        
            const { clientX: left, clientY: top } = e;
            const contextMenu = <GridContextMenu component={this}
                location={location}
                options={{
                    ...options,
                    model,
                    showFilters: props.showFilters
                }}
                doAction={handleContextMenuAction} />;
        
            PopupService.showPopup({ left: Math.round(left), top: Math.round(top), component: contextMenu });
        
        },[model, props])

        const handleContextMenuAction = useCallback((action, {column}) => {
            switch (action) {
            case ContextMenuActions.SortAscending: return sort(column, 'asc');
            case ContextMenuActions.SortDescending: return sort(column, 'dsc');
            case ContextMenuActions.SortAddAscending: return sort(column, 'asc', true);
            case ContextMenuActions.SortAddDescending: return sort(column, 'dsc', true);
            case ContextMenuActions.GroupBy: return groupBy(column);
            case ContextMenuActions.GroupByReplace: return groupBy(column, true);
            default:

            }

            if (action === 'groupby-remove') {
                this.groupBy(data.column);
            } else if (action === 'show-filters') {
                this.setState({showFilters: this.state.showFilters === false});
            } else if (action === 'hide-filters') {
                this.props.dispatch({ type: 'SAVE_CONFIG', config: { showFilters: false } });
            }

        },[]);

        const handleColumnMove = () =>  console.log(`handleColumnMove`)
        const handleToggleCollapseColumn = () => console.log(`handleToggleCollapseColumn`)
        const toggleGroupAll = () => console.log('toggleGroupAll');
        const groupBy = () => console.log('groupBy');

        const sortGroup = () => console.log('sortGroup');
        const toggleGroup = () => console.log('toggleGroup');

        const handleVerticalScroll = () => console.log('handleVerticalScroll');
        const handleHorizontalScroll = () => console.log('handleHorizontalScroll');
        const handleSelectionChange = () => console.log('handleSelectionChange');
        const handleCellClick = () => console.log('handleCellClick');

        return (
            <div style={{ ...style, position: 'relative', height, width }} className={className}>
                {showHeaders &&
                    <Header ref={header}
                        height={headingHeight}
                        gridModel={model}
                        onColumnResize={handleColumnResize}
                        onColumnMove={handleColumnMove}
                        onToggleCollapse={handleToggleCollapseColumn}
                        onToggleGroupState={toggleGroupAll}
                        onRemoveGroupbyColumn={groupBy}
                        onSort={sort}
                        onSortGroup={sortGroup}
                        onHeaderClick={props.onHeaderClick}
                        colHeaderRenderer={props.colHeaderRenderer}
                        onContextMenu={showContextMenu} />}

                {/* {showFilters &&
                    <InlineFilter ref={inlineFilter}
                        onFilter={this.handleFilter}
                        onSelect={this.handleSelection}
                        onClearFilter={this.handleClearFilter}
                        onFilterOpen={this.handleFilterOpen}
                        onFilterClose={this.handleFilterClose}
                        onSearchText={this.handleSearchText}
                        showFilter={this.state.showFilter}
                        dataView={dataView}
                        gridModel={model}
                        height={filterHeight}
                        style={{ position: 'absolute', top: headerHeight, height: filterHeight, width: width }} />} */}

                <Motion defaultStyle={{ top: headingHeight }} style={{ top: spring(totalHeaderHeight) }}>
                    {interpolatingStyle =>
                        <Viewport
                            ref={viewport}
                            rows={data.rows}
                            selectedRows={data.selected}
                            selectionDefault={selectionDefault}
                            style={interpolatingStyle}
                            height={height - totalHeaderHeight}
                            width={model.width}
                            gridModel={model}
                            onToggleGroup={toggleGroup}
                            onSetRange={setViewRange}
                            onVerticalScroll={handleVerticalScroll}
                            onHorizontalScroll={handleHorizontalScroll}
                            onSelectionChange={handleSelectionChange}
                            onCellClick={handleCellClick}
                            onContextMenu={showContextMenu}
                        />}
                </Motion>
                {emptyDisplay}

                {model._movingColumn &&
                    <ColumnBearer gridModel={model} rows={data.rows} />}

            </div>
        );

    // componentWillMount() {
    //     this._scrollLeft = undefined;
    // }

    // componentWillUnmount() {
    //     this._scrollLeft = undefined;
    //     this.state.dataView.unsubscribe();        

    //     // don't destroy a  Data View that we don't sown
    //     if (!this.props.dataView){
    //         this.state.dataView.destroy();
    //     }

    // }

    // componentDidMount() {
    //     this.onHorizontalScroll();
    // }

    // componentDidUpdate() {
    //     this.onHorizontalScroll();
    // }

    // componentWillReceiveProps(nextProps) {

    //     const {data, dataView, defaultSelected, selected, width, height} = nextProps;
    //     if (data !== this.props.data) {
    //         const [rows, rowCount] = this.state.dataView.setData(data);
    //         this.setState({
    //             model: this.reducer.dispatch({ type: Action.ROWCOUNT, rowCount }),
    //             rows
    //         });
    //     } else if (dataView !== this.props.dataView){
    //         this.props.dataView.removeListener(DataTypes.ROW_DATA, this.onRowset);
    //         dataView.on(DataTypes.ROW_DATA, this.onRowset);
    //         const {height, rowHeight} = this.state.model;
    //         const visibleRows = Math.ceil(height / rowHeight); // not accurate, we should store this
    //         dataView.setRange(0, visibleRows, false);
    //         this.setState({ dataView });
    //     }

    //     if (selected !== this.props.selected || defaultSelected !== this.props.defaultSelected){
    //         this.setState({
    //             selected: defaultSelected || selected
    //         });
    //     }

    //     // we only actually need to reset the model when height or length
    //     // changes if vertical scroll state is affected - if we go from
    //     // vertical scrollbar showing to no vertical scrollbar or vice versa.

    //     if (this.props.width !== width || this.props.height !== nextProps.height){
    //     //     this.props.height !== nextProps.height ||
    //     //     this.props.columns !== nextProps.columns ||
    //     //     model.sortCriteria !== dataView.sortCriteria ||
    //     //     model.groupBy !== dataView.groupBy ||
    //     //     this.props.groupColumnWidth !== nextProps.groupColumnWidth) {

    //     //     const {columns, minColumnWidth, groupColumnWidth} = nextProps;
    //     //     const {sortCriteria, groupBy} = dataView;
    //     //     // careful, columns depends on groupBy
    //         this.setState({
    //             model: this.reducer.dispatch({ type: Action.GRID_RESIZE, width, height })
    //         });
    //     }

    // }

    // handleFilterOpen = column => {
    //     if (this.state.showFilter !== column.name){
    //         // we could call dataView here to trigger build of filter data
    //         // this could be moved down to serverApi
    //         const {key, name} = column.isGroup ? column.columns[0] : column;

    //         this.state.dataView.getFilterData({
    //             key, name
    //         });
    //         setTimeout(() => {
    //             this.setState({
    //                 showFilter: column.name
    //             });
    //         }, 50)
    //     }
    // }

    // handleFilter = (column, newFilter) => {
    //     const filter = filterUtils.addFilter(this.state.model.filter,newFilter);
    //     console.log(`
    //         add filter ${JSON.stringify(newFilter,null,2)}
    //         to filter ${JSON.stringify(this.state.model.filter,null,2)}
            
    //         creates new filter = ${JSON.stringify(filter,null,2)}
    //     `)
        
    //     this.state.dataView.filter(filter);
    //     this.setState({
    //         model: this.reducer.dispatch({ type: Action.FILTER, column, filter })
    //     });

    //     if (newFilter.isNumeric){
    //         // re-request the filterData, this will re-create bins on the filtered data
    //         const {key, name} = column.isGroup ? column.columns[0] : column;
    //         this.state.dataView.getFilterData({ key, name });
    //     }
    // }

    // handleClearFilter = column => {
    //     const filter = filterUtils.removeFilterForColumn(this.state.model.filter,column);
    //     this.state.dataView.filter(filter);
    //     this.setState({
    //         model: this.reducer.dispatch({ type: Action.FILTER, column, filter })
    //     });
    // }

    // handleFilterClose = (/*column*/) => {
    //     this.setState({
    //         showFilter: null
    //     });
    //     this.state.dataView.setRange(0,0,false,DataTypes.FILTER_DATA);
    // }

    // handleSearchText = ({key, name},text) => {
    //     this.state.dataView.getFilterData({key,name}, text);
    // }

    // sortGroup = column => {
    //     const model = this.reducer.dispatch({ type: Action.SORT_GROUP, column });
    //     this.state.dataView.groupBy(model.groupBy);
    //     this.setState({ model });
    // }

    // groupBy = (column, replace) => {
    //     const existingGroupBy = this.state.model.groupBy;
    //     const extendsExistingGroupBy = !replace && Array.isArray(existingGroupBy) && existingGroupBy.length > 0;
    //     const groupBy = groupHelpers.updateGroupBy(existingGroupBy, column, replace);
    //     const model = this.reducer.dispatch({ type: Action.GROUP, groupBy });
    //     const groupToggled = groupBy !== null;
    //     this.setState({ model, groupToggled }, () => {
    //         this.state.dataView.groupBy(groupBy, extendsExistingGroupBy);
    //         this.viewport.current.setScroll(0, 0);
    //     });
    // }

    // toggleGroup = groupRow => {

    //     const { model, dataView } = this.state;
    //     const groupState = groupHelpers.toggleGroupState(groupRow, model);
    //     dataView.setGroupState(groupState);
    //     this.setState({
    //         model: this.reducer.dispatch({ type: Action.TOGGLE, groupState })
    //     });
    // }

    // toggleGroupAll = (column, expanded) => {
    //     console.log(`toggleGroupAll ${column.name}`)
    //     const groupState = expanded === 1
    //         ? {'*': true}
    //         : {};
    //     this.state.dataView.setGroupState(groupState);
    //     this.setState({
    //         model: this.reducer.dispatch({ type: Action.TOGGLE, groupState })
    //     });
    // }

    // handleColumnMoveBegin = (column) => {
    //     if (column.isHeading) {
    //         console.log(`col  heading move begin`);
    //     } else {
    //         this.setState({ model: this.reducer.dispatch({ type: Action.MOVE_BEGIN, column, scrollLeft: this._scrollLeft }) });
    //     }
    // }

    // handleColumnMove = (phase, column, distance) => {
    //     if (phase === 'move' && distance !== 0) {

    //         if (this._scrollTimer !== null) {
    //             cancelAnimationFrame(this._scrollTimer);
    //             this._scrollTimer = null;
    //         }

    //         this.setState((/*state*/) => {
    //             let model = this.reducer.dispatch({ type: Action.MOVE, distance, scrollLeft: this._scrollLeft });
    //             if (model._overTheLine) {
    //                 const scroll = () => {
    //                     const type = model._overTheLine > 0 ? Action.SCROLL_RIGHT : Action.SCROLL_LEFT;
    //                     const scrollDistance = type === Action.SCROLL_RIGHT ? 3 : -3;
    //                     const { scrollLeft } = this.reducer.state;
    //                     model = this.reducer.dispatch({ type, scrollDistance });
    //                     if (model.scrollLeft !== scrollLeft) {
    //                         this.viewport.current.scrollTo(model.scrollLeft);
    //                         this._scrollTimer = requestAnimationFrame(scroll);
    //                         this.setState({ model });
    //                     }
    //                 };

    //                 this._scrollTimer = requestAnimationFrame(scroll);
    //             }
    //             return { model };
    //         });

    //     } else if (phase === 'begin') {
    //         this.handleColumnMoveBegin(column);
    //     } else if (phase === 'end') {
    //         this.handleColumnMoveEnd(column);
    //     }
    // }

    // handleColumnMoveEnd = column => {
    //     if (column.isHeading) {
    //         console.log(`col heading move end`);
    //     } else {
    //         this.setState({ model: this.reducer.dispatch({ type: Action.MOVE_END, column }) });
    //     }
    // }

    // handleToggleCollapseColumn = column => {
    //     const action = column.collapsed ? Action.COLUMN_EXPAND : Action.COLUMN_COLLAPSE;
    //     this.setState({ model: this.reducer.dispatch({ type: action, column }) });
    // }


    // // This is being used to handle selection in a set filter, need to consider how it will work
    // // with regular row selection
    // handleSelection = (dataType, colName, filterMode) => {
    //     this.state.dataView.select(dataType, colName, filterMode);
    // }

    // handleSelectionChange = (selected, idx, selectedItem) => {
    //     this.setState({selected}, () => {
    //         if (this.props.onSelectionChange) {
    //             this.props.onSelectionChange(selected, idx);
    //         }
    //         if (selected.length === 1 && this.props.onSingleSelect) {
    //             idx = selected[0];
    //             this.props.onSingleSelect(idx, selectedItem);
    //         }
    //     });
    // }

    // handleCellClick = (selectedCell) => {
    //     if (this.props.onSelectCell) {
    //         this.props.onSelectCell(selectedCell);
    //     }
    // }

    // // do we need to call a prop for this ?
    // handleVerticalScroll = (scrollTop) => {

    //     if (this.props.onScroll) {
    //         this.props.onScroll({ scrollTop });
    //     }
    // }

    // handleHorizontalScroll = scrollLeft => {
    //     if (this._scrollLeft !== scrollLeft) {
    //         this._scrollLeft = scrollLeft;
    //         this.onHorizontalScroll();
    //     }

    //     if (this.props.onScroll) {
    //         this.props.onScroll({ scrollLeft });
    //     }
    // }

    // onHorizontalScroll() {
    //     const scrollLeft = this._scrollLeft;
    //     if (this.header.current) {
    //         this.header.current.setScrollLeft(scrollLeft);
    //     }
    //     if (this.inlineFilter.current) {
    //         this.inlineFilter.current.setScrollLeft(scrollLeft);
    //     }
    // }

}


export default Grid;