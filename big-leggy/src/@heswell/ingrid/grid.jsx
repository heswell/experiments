// TODO calculate width, height if not specified
/*global requestAnimationFrame cancelAnimationFrame */
import React from 'react';
import cx from 'classnames';
import * as Action from './model/constants';
import { Motion, spring } from 'react-motion';
import GridReducer from './model/gridReducer';
import Header from './header/header';
import ColumnBearer from './core/ColumnBearer';
import InlineFilter from './header/inlineFilter';
import Viewport from './core/viewport';
import {getScrollbarSize, getColumnWidth} from './utils/domUtils';
import { PopupService } from './services';
import GridContextMenu, { ContextMenuActions } from './contextMenu';
import {DataTypes, filterUtils, groupHelpers} from '../data';
import {LocalView} from '../data';

import './grid.css';

export default class Grid extends React.Component {

    static defaultProps = {
        style: {},
        selected: [],
        headerHeight: 25,
        rowHeight: 23,
        minColumnWidth: 80,
        onContextMenu: () => { },
        showFilters: false
    };

    inlineFilter;
    header;
    viewport;
    // can this be replaced with value from model ?
    _scrollLeft;
    reducer;
    _scrollTimer;

    constructor(props) {
        super(props);
        let { data = null, dataView = null/*, tableName: tablename*/, showFilters, groupBy } = props;
        if (dataView === null) {
            if (data !== null) {
                dataView = LocalView.from(data, { columns: props.columns, groupBy });
            } /*else if (tablename) {
                dataView = new RemoteView({ tablename, columns: props.columns });
            }*/
        }

        const scrollbarSize = getScrollbarSize();
        const { columns, columnMap } = dataView;
        // we know height and rowheight, can can make an accurate estimation of range
        // const [rows, rowCount] = dataView.getRows(); // should pass any sort,group criteria
        const headerHeight = props.showHeaders === false ? 0 : props.headerHeight;
        this.reducer = new GridReducer({ ...props, columns, columnMap, scrollbarSize, headerHeight });

        const model = this.reducer.state;
        const selected = props.defaultSelected || props.selected || [];
        // we need to store rows in state so we can identify when they change. Everything else on dataView should be write only   
        this.state = { model, dataView, rows: [], showFilters, selected, groupToggled: false };

        dataView.on(DataTypes.ROW_DATA, this.onRowset);

    }

    onRowset = (msgType, rows, rowCount=null, selected=null) => {
        // maybe we should be setting rows and length in state
        const state = {};

        if (rows){
            state.rows = rows;
        }

        if (selected){
            state.selected = selected;
        }

        if (this.state.groupToggled && rowCount !== 0){
            const [group] = this.state.model._groups;
            const [column] = group.columns;
            const width = getColumnWidth(column);
            state.model = this.reducer.dispatch({ type: Action.GROUP_COLUMN_WIDTH, column, width });
            state.groupToggled = false;
        }

        if (rowCount !== null && rowCount !== this.state.model.rowCount) {
            state.model = this.reducer.dispatch({ type: Action.ROWCOUNT, rowCount });
        }
        this.setState(state);
    }

    render() {
        const { model, rows, showFilters, dataView, selected } = this.state;
        const { height, width, headerHeight, _headingDepth } = model;
        const { style, selectionDefault } = this.props;
        const isEmpty = this.state.dataView.size <= 0;
        const emptyDisplay = (isEmpty && this.props.emptyDisplay) || null;
        const className = cx(
            'Grid',
            this.props.className,
            emptyDisplay ? 'empty' : '',
            isEmpty && this.props.showHeaderWhenEmpty === false ? 'no-header' : ''
        );

        const filterHeight = showFilters ? 24 : 0;
        const showHeaders = this.props.showHeaders !== false && headerHeight !== 0;
        const headingHeight = showHeaders ? headerHeight * _headingDepth : 0;
        const totalHeaderHeight = headingHeight + filterHeight;

        this.inlineFilter = null;

        return (
            <div style={{ ...style, position: 'relative', height, width }} className={className}>
                {showHeaders &&
                    <Header ref={header => this.header = header}
                        height={headingHeight}
                        gridModel={model}
                        onColumnResize={this.handleColumnResize}
                        onColumnMove={this.handleColumnMove}
                        onToggleCollapse={this.handleToggleCollapseColumn}
                        onToggleGroupState={this.toggleGroupAll}
                        onRemoveGroupbyColumn={this.groupBy}
                        onSort={this.sort}
                        onSortGroup={this.sortGroup}
                        onHeaderClick={this.props.onHeaderClick}
                        colHeaderRenderer={this.props.colHeaderRenderer}
                        onContextMenu={this.showContextMenu} />}

                {showFilters &&
                    <InlineFilter ref={filter => this.inlineFilter = filter}
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
                        style={{ position: 'absolute', top: headerHeight, height: filterHeight, width: width }} />}

                <Motion defaultStyle={{ top: headingHeight }} style={{ top: spring(totalHeaderHeight) }}>
                    {interpolatingStyle =>
                        <Viewport
                            ref={viewport => this.viewport = viewport}
                            rows={rows}
                            selectedRows={selected}
                            selectionDefault={selectionDefault}
                            style={interpolatingStyle}
                            height={height - totalHeaderHeight}
                            width={model.width}
                            gridModel={this.state.model}
                            onToggleGroup={this.toggleGroup}
                            onSetRange={this.setViewRange}
                            onVerticalScroll={this.handleVerticalScroll}
                            onHorizontalScroll={this.handleHorizontalScroll}
                            onSelectionChange={this.handleSelectionChange}
                            onCellClick={this.handleCellClick}
                            onContextMenu={this.showContextMenu}
                        />}
                </Motion>
                {emptyDisplay}

                {model._movingColumn &&
                    <ColumnBearer
                        column={model._movingColumn}
                        headingDepth={_headingDepth}
                        headerHeight={model.headerHeight}
                        rows={rows} />}

            </div>
        );
    }

    componentWillMount() {
        this._scrollLeft = undefined;
    }

    componentWillUnmount() {
        this._scrollLeft = undefined;
        this.header = null;
        this.inlineFilter = null;
        this.state.dataView.removeListener(DataTypes.ROW_DATA, this.onRowset)
        // don't destroy a  Data View that we don't sown
        if (!this.props.dataView){
            this.state.dataView.destroy();
        }

    }

    componentDidMount() {
        this.onHorizontalScroll();
    }

    shouldComponenetUpdate() {
        // false if the only update was to store scrollLeft in state
        return true;
    }

    componentWillReceiveProps(nextProps) {

        const {data, dataView, defaultSelected, selected, width, height} = nextProps;
        if (data !== this.props.data) {
            const [rows, rowCount] = this.state.dataView.setData(data);
            this.setState({
                model: this.reducer.dispatch({ type: Action.ROWCOUNT, rowCount }),
                rows
            });
        } else if (dataView !== this.props.dataView){
            this.props.dataView.removeListener(DataTypes.ROW_DATA, this.onRowset);
            dataView.on(DataTypes.ROW_DATA, this.onRowset);
            const {height, rowHeight} = this.state.model;
            const visibleRows = Math.ceil(height / rowHeight); // not accurate, we should store this
            dataView.setRange(0, visibleRows, false);
            this.setState({ dataView });
        }

        if (selected !== this.props.selected || defaultSelected !== this.props.defaultSelected){
            this.setState({
                selected: defaultSelected || selected
            });
        }

        // we only actually need to reset the model when height or length
        // changes if vertical scroll state is affected - if we go from
        // vertical scrollbar showing to no vertical scrollbar or vice versa.

        if (this.props.width !== width || this.props.height !== nextProps.height){
        //     this.props.height !== nextProps.height ||
        //     this.props.columns !== nextProps.columns ||
        //     model.sortCriteria !== dataView.sortCriteria ||
        //     model.groupBy !== dataView.groupBy ||
        //     this.props.groupColumnWidth !== nextProps.groupColumnWidth) {

        //     const {columns, minColumnWidth, groupColumnWidth} = nextProps;
        //     const {sortCriteria, groupBy} = dataView;
        //     // careful, columns depends on groupBy
            this.setState({
                model: this.reducer.dispatch({ type: Action.GRID_RESIZE, width, height })
            });
        }

    }

    componentDidUpdate() {
        this.onHorizontalScroll();
    }

    setViewRange = (firstVisibleRow, lastVisibleRow, initialRange=false) => {
        const sendDelta = initialRange === false
        this.state.dataView.setRange(firstVisibleRow, lastVisibleRow, sendDelta);
    }

    handleFilterOpen = column => {
        if (this.state.showFilter !== column.name){
            // we could call dataView here to trigger build of filter data
            // this could be moved down to serverApi
            const {key, name} = column.isGroup ? column.columns[0] : column;

            this.state.dataView.getFilterData({
                key, name
            });
            setTimeout(() => {
                this.setState({
                    showFilter: column.name
                });
            }, 50)
        }
    }

    // Note: when we update a set filter, this may leave us with other set filters containing entries which are no longer valid.
    // These won't do nay harm as long as UI guards against trying to select them.
    handleFilter = (column, newFilter) => {
        const filter = filterUtils.addFilter(this.state.model.filter,newFilter);
        this.state.dataView.filter(filter);
        this.setState({
            model: this.reducer.dispatch({ type: Action.FILTER, column, filter })
        });
    }

    handleClearFilter = column => {
        const filter = filterUtils.removeFilterForColumn(this.state.model.filter,column);
        this.state.dataView.filter(filter);
        this.setState({
            model: this.reducer.dispatch({ type: Action.FILTER, column, filter })
        });
    }

    handleFilterClose = (/*column*/) => {
        this.setState({
            showFilter: null
        });
        this.state.dataView.setRange(0,0,false,DataTypes.FILTER_DATA);
    }

    handleSearchText = ({key, name},text) => {
        this.state.dataView.getFilterData({key,name}, text);
    }

    sort = (column, direction = null, preserveExistingSort = false) => {
        // this will transform the columns which will cause whole grid to re-render down to cell level. All
        // we really need if for headers to rerender. SHould we store sort criteria outside of columns ?
        const model = this.reducer.dispatch({ type: Action.SORT, column, direction, preserveExistingSort });
        this.setState({ model }, () => {
            this.state.dataView.sort(model.sortBy);
            this.viewport.setScroll(0);
        });
    }

    sortGroup = column => {
        const model = this.reducer.dispatch({ type: Action.SORT_GROUP, column });
        this.state.dataView.groupBy(model.groupBy);
        this.setState({ model });
    }

    groupBy = (column, replace) => {
        const existingGroupBy = this.state.model.groupBy;
        const extendsExistingGroupBy = !replace && Array.isArray(existingGroupBy) && existingGroupBy.length > 0;
        const groupBy = groupHelpers.updateGroupBy(existingGroupBy, column, replace);
        const model = this.reducer.dispatch({ type: Action.GROUP, groupBy });
        const groupToggled = groupBy !== null;
        this.setState({ model, groupToggled }, () => {
            this.state.dataView.groupBy(groupBy, extendsExistingGroupBy);
            this.viewport.setScroll(0, 0);
        });
    }

    toggleGroup = groupRow => {

        const { model, dataView } = this.state;
        const groupState = groupHelpers.toggleGroupState(groupRow, model);
        dataView.setGroupState(groupState);
        this.setState({
            model: this.reducer.dispatch({ type: Action.TOGGLE, groupState })
        });
    }

    toggleGroupAll = (column, expanded) => {
        const groupState = expanded === 1
            ? {'*': true}
            : {};
        this.state.dataView.setGroupState(groupState);
        this.setState({
            model: this.reducer.dispatch({ type: Action.TOGGLE, groupState })
        });
    }

    handleColumnResizeBegin = column => {
        this.setState({ model: this.reducer.dispatch({ type: Action.COLUMN_RESIZE_BEGIN, column }) });
    }

    handleColumnResize = (phase, column, width) => {
        if (phase === 'resize') {
            if (column.isHeading) {
                this.setState({ model: this.reducer.dispatch({ type: Action.RESIZE_HEADING, column, width }) });
            } else {
                // TODO do we need to consider scrolling ?
                this.setState({ model: this.reducer.dispatch({ type: Action.COLUMN_RESIZE, column, width }) });
            }
        } else if (phase === 'begin') {
            this.handleColumnResizeBegin(column);
        } else if (phase === 'end') {
            this.handleColumnResizeEnd(column);
        }
    }

    //TODO shouldn't we hande width here ?
    handleColumnResizeEnd = column => {
        this.setState({ model: this.reducer.dispatch({ type: Action.COLUMN_RESIZE_END, column }) });
    }

    handleColumnMoveBegin = (column) => {
        if (column.isHeading) {
            console.log(`col  heading move begin`);
        } else {
            this.setState({ model: this.reducer.dispatch({ type: Action.MOVE_BEGIN, column, scrollLeft: this._scrollLeft }) });
        }
    }

    handleColumnMove = (phase, column, distance) => {
        if (phase === 'move' && distance !== 0) {

            if (this._scrollTimer !== null) {
                cancelAnimationFrame(this._scrollTimer);
                this._scrollTimer = null;
            }

            this.setState((/*state*/) => {
                let model = this.reducer.dispatch({ type: Action.MOVE, distance, scrollLeft: this._scrollLeft });
                if (model._overTheLine) {
                    const scroll = () => {
                        const type = model._overTheLine > 0 ? Action.SCROLL_RIGHT : Action.SCROLL_LEFT;
                        const scrollDistance = type === Action.SCROLL_RIGHT ? 3 : -3;
                        const { scrollLeft } = this.reducer.state;
                        model = this.reducer.dispatch({ type, scrollDistance });
                        if (model.scrollLeft !== scrollLeft) {
                            this.viewport.scrollTo(model.scrollLeft);
                            this._scrollTimer = requestAnimationFrame(scroll);
                            this.setState({ model });
                        }
                    };

                    this._scrollTimer = requestAnimationFrame(scroll);
                }
                return { model };
            });

        } else if (phase === 'begin') {
            this.handleColumnMoveBegin(column);
        } else if (phase === 'end') {
            this.handleColumnMoveEnd(column);
        }
    }

    handleColumnMoveEnd = column => {
        if (column.isHeading) {
            console.log(`col heading move end`);
        } else {
            this.setState({ model: this.reducer.dispatch({ type: Action.MOVE_END, column }) });
        }
    }

    handleToggleCollapseColumn = column => {
        const action = column.collapsed ? Action.COLUMN_EXPAND : Action.COLUMN_COLLAPSE;
        this.setState({ model: this.reducer.dispatch({ type: action, column }) });
    }

    showContextMenu = (e, location, options) => {

        e.preventDefault();
        e.stopPropagation();

        const { clientX: left, clientY: top } = e;

        const contextMenu = <GridContextMenu component={this}
            location={location}
            options={{
                ...options,
                model: this.state.model,
                showFilters: this.props.showFilters
            }}
            doAction={this.handleContextMenuAction} />;

        PopupService.showPopup({ left, top, component: contextMenu });

    }

    handleContextMenuAction = (action, data) => {

        switch (action) {
        case ContextMenuActions.SortAscending: return this.sort(data.column, 'asc');
        case ContextMenuActions.SortDescending: return this.sort(data.column, 'dsc');
        case ContextMenuActions.SortAddAscending: return this.sort(data.column, 'asc', true);
        case ContextMenuActions.SortAddDescending: return this.sort(data.column, 'dsc', true);
        case ContextMenuActions.GroupBy: return this.groupBy(data.column);
        case ContextMenuActions.GroupByReplace: return this.groupBy(data.column, true);
        default:

        }

        if (action === 'groupby') {
            this.groupBy(data.column);
        } else if (action === 'groupby-remove') {
            this.groupBy(data.column);
        } else if (action === 'show-filters') {
            this.setState({showFilters: this.state.showFilters === false});
        } else if (action === 'hide-filters') {
            this.props.dispatch({ type: 'SAVE_CONFIG', config: { showFilters: false } });
        }

    }

    // This is being used to handle selection in a set filter, need to consider how it will work
    // with regular row selection
    handleSelection = (dataType, colName, filterMode) => {
        this.state.dataView.select(dataType, colName, filterMode);
    }

    handleSelectionChange = (selected, idx, selectedItem) => {
        this.setState({selected}, () => {
            if (this.props.onSelectionChange) {
                this.props.onSelectionChange(selected, idx);
            }
            if (selected.length === 1 && this.props.onSingleSelect) {
                idx = selected[0];
                this.props.onSingleSelect(idx, selectedItem);
            }
        });
    }

    handleCellClick = (selectedCell) => {
        if (this.props.onSelectCell) {
            this.props.onSelectCell(selectedCell);
        }
    }

    handleVerticalScroll = (scrollTop) => {

        if (this.props.onScroll) {
            this.props.onScroll({ scrollTop });
        }
    }

    handleHorizontalScroll = scrollLeft => {
        if (this._scrollLeft !== scrollLeft) {
            this._scrollLeft = scrollLeft;
            this.onHorizontalScroll();
        }

        if (this.props.onScroll) {
            this.props.onScroll({ scrollLeft });
        }
    }

    onHorizontalScroll() {
        const scrollLeft = this._scrollLeft;
        if (this.header) {
            this.header.setScrollLeft(scrollLeft);
        }
        if (this.inlineFilter) {
            this.inlineFilter.setScrollLeft(scrollLeft);
        }
    }

}
