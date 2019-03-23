import React from 'react';
import ReactDOM from 'react-dom';
import cx from 'classnames';
import { SetFilter, NumberFilter, MultiColumnFilter } from '../../ingrid-extras';
import { filterUtils, columnUtils, filter } from '../../data';
import { PopupService } from '../services';

const {SET, STARTS_WITH, EXCLUDE} = filter;

//TODO how do we determine if filter is active sans filterData
export default class ColumnFilter extends React.Component {

    keyDown = e => this.props.onKeyDown(this.props.column, e);

    showFilter = () => {
        this.props.onFilterOpen(this.props.column);
    }

    // close filter is a user action
    closeFilter = () => {
        PopupService.hidePopup();
    }

    // hide fires when the filter has been closed
    hideFilter = () => {
        setTimeout(() => {
            // needs delay to ensure firing after ColumnFilter is rerendered with new 
            // clickhandler which would otherwise immediately re-open filter.
            this.props.onFilterClose();
        }, 50);
    }

    clearFilter = () => {
        //TODO this will need wotk for a group column filter
        this.props.onClearFilter(this.props.column);
    }

    handleSetSelectionChange = (selected, filterMode, searchText) => {
        const {column, onFilter} = this.props;
        // same for an include filter that includes every value, but we don't normally represent it that way
        if (filterMode === EXCLUDE && selected !== null && selected.length === 0) {
            this.props.onClearFilter(column);
        } else if (searchText) {
            onFilter(column, {
                type: STARTS_WITH,
                mode: filterMode,
                colName: column.name,
                value: searchText
            });
        } else {
            onFilter(column, {
                type: SET,
                mode: filterMode,
                colName: column.name,
                values: [selected]
            });
        }
    }

    handleNumberFilterChange = (column, filter) => {
        this.props.onFilter(column, filter);
    }

    handleFilter = (/*filter*/) => {

    }

    componentWillReceiveProps(nextProps) {
        const { showFilter: isShowingFilter = null, column, dataView } = this.props;
        const { showFilter: willShowFilter = null, filter } = nextProps;
        const keepShowing = isShowingFilter && willShowFilter;
        const showPopup = !isShowingFilter && willShowFilter;
        // Note: the filter popup may have been closed by the PopupService and showPopup
        // may not yet have been updated to reflect this (because of the timeout). 
        // Be careful not to reopen the popup when the filter is nulled. 
        const filterChanged = keepShowing && filter && filter !== this.props.filter;
        if (showPopup || filterChanged) {
            const component = this.getFilter(column, filter, dataView);
            const el = ReactDOM.findDOMNode(this);
            const { left, top } = el.getBoundingClientRect();
            PopupService.showPopup({ left: Math.round(left)-1, top: top - 26, component });
        }

    }

    getFilter(column, filter, dataView) {
        console.log(`COlumnFilter, extractFilterFromColumn ${column.name} ${JSON.stringify(filter)}`)
        const columnFilter = filterUtils.extractFilterForColumn(filter, column.name);

        if (!column.isGroup || column.columns.length === 1) {
            switch (columnUtils.getFilterType(column)) {
                case 'number':
                    return (
                        <NumberFilter column={column} height={250}
                            className='FilterPanel'
                            dataView={dataView}
                            filter={columnFilter}
                            onHide={this.hideFilter}
                            onClose={this.closeFilter}
                            onApplyFilter={this.handleNumberFilterChange} />
                    );
                default:
                    return (
                        <SetFilter className='FilterPanel'
                            column={column}
                            height={300}
                            width={column.width + 120}
                            dataView={dataView}
                            filter={columnFilter}
                            onHide={this.hideFilter}
                            onClose={this.closeFilter}
                            onSelectionChange={this.handleSetSelectionChange}
                            onSearchText={this.props.onSearchText} />
                    );
            }

        } else {
            return <MultiColumnFilter
                column={column}
                height={261}
                width={300}
                filter={filter}
                dataView={dataView}
                onHide={this.hideFilter}
                onClose={this.closeFilter}
                onSearchText={this.props.onSearchText}
                onApplyFilter={this.handleFilter}
                onSelectionChange={this.handleSetSelectionChange} />;
        }
    }

    render() {
        const { column, showFilter, filter } = this.props;
        const isActive = filterUtils.includesColumn(filter, column);
        const className = cx('HeaderCell', { 'filter-active': isActive, 'filter-showing': showFilter });
        // const width = column.width - (18 + (isActive ? 17 : 0));
        return (
            // we only need care about opening the filter - the Popop service will close if for us.
            <div className={className} style={{ padding: 0, width: column.width }}>
                <div className='filter-button' onClick={this.showFilter}>
                    <i className="material-icons">filter_list</i>
                </div>
                <div className="filter-input-container">
                    <input className="filter-input" type='text' onKeyDown={this.keyDown} />
                </div>
                {isActive &&
                    <div className='filter-clear-button' onClick={this.clearFilter}>
                        <i className="material-icons">cancel</i>
                    </div>}
            </div>
        );
    }
}
