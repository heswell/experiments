
import React, { useCallback, useEffect, useRef, useState, useReducer } from 'react';
import cx from 'classnames';
import { filter as filterUtils, DataTypes, FilterDataView as FilterView } from '@heswell/data';
import {FlexBox} from '@heswell/inlay';

import {FilterPanelHeader} from '../filter-panel-header.jsx';
import CheckList from '../check-list.jsx';
import SearchBar from '../filter-toolbar.jsx';
import {FilterCounts} from '../filter-counts.jsx';
import './set-filter.css';

const { 
    IN,
    NOT_IN,
    STARTS_WITH,
    NOT_STARTS_WITH, 
    SET_FILTER_DATA_COLUMNS
} = filterUtils;

const NO_STYLE = {}
const NO_COUNT = {}

const SET_FILTER_DATA_COLUMNS_NO_COUNT = SET_FILTER_DATA_COLUMNS.filter(col => col.name !== 'count');

export const INCLUDE = 'include';
export const EXCLUDE = 'exclude';

const ZeroRowFilter = {
    colName: 'count',
    type: NOT_IN,
    values: [0]
}

const SelectionStatus = {
    Init: 'init',
    All: 'all',
    None: 'none',
    Some : 'some'
}

function getSelectionStatus(totalCount, selectedCount){
    if (totalCount === 0){
        return SelectionStatus.Init;
    } else if (selectedCount === 0){
        return SelectionStatus.None;
    } else if (totalCount === selectedCount) {
        return SelectionStatus.All
    } else {
        return SelectionStatus.Some;
    }
}

export const SetFilter = ({
    className,
    column,
    dataView,
    filter,
    height,
    onClose,
    onHide,
    onMouseDown,
    style=NO_STYLE,
    suppressHeader = false,
    suppressSearch = false,
    suppressFooter = false

}) => {

    const columnFilter = filterUtils.extractFilterForColumn(filter, column.name);
    const [showZeroRows, setZeroRows] = useState(true);
    const [dataCounts, setDataCounts] = useState(NO_COUNT);
    const filterView = useRef(new FilterView(dataView, column));
    const searchText = useRef('');
    
    const {filterRowTotal=0, filterRowSelected=0} = dataCounts;
    const selectionStatus = getSelectionStatus(filterRowTotal,filterRowSelected);

    useEffect(() => {
        // TODO how do we add multiple subscriptions
        filterView.current.subscribeToDataCounts(setDataCounts);
        return () => {
            filterView.current.unsubscribeFromDataCounts();
            onHide();
        }
    }, [dataView])

    const toggleZeroRows = useCallback(() => {
        const showZero = !showZeroRows;
        setZeroRows(showZero);
        filterView.current.filter(showZero ? null : ZeroRowFilter);
    },[showZeroRows])

    const handleSearchText = text => {
        searchText.current = text;
        filterView.current.getFilterData(column, text)
        // if we're removing searchtext to widen the search, we need to reevaluate the selectionDefault
    }

    const handleDeselectAll = useCallback(() => {
        if (searchText.current) {
            applyFilter(NOT_STARTS_WITH, searchText.current);
        } else {
            applyFilter(IN, undefined, []);
        }
    },[column]);

    const handleSelectAll = useCallback(() => {
        if (searchText.current) {
            applyFilter(STARTS_WITH, searchText.current);
        } else {
            applyFilter(NOT_IN, undefined, []);
        }
    },[column]);

    const applyFilter = useCallback((type, value, values) => {
        filterView.current.filter({type, colName: column.name, value, values}, DataTypes.ROW_DATA, true);
    },[column])

    const allSelected = selectionStatus === 'all';
    const clickHandler = allSelected ? handleDeselectAll : handleSelectAll;

    // somehow this needs to dispatch model-reducer if it's a change
    const filterColumns = filter === null || columnFilter === filter
        ? SET_FILTER_DATA_COLUMNS_NO_COUNT
        : SET_FILTER_DATA_COLUMNS

    console.log(`dataCounts ${JSON.stringify(dataCounts,null,2)}`)

    // TODO envelope should be part of columnFilter
    return (
        <FlexBox className={cx('SetFilter', 'ColumnFilter', className)} style={{ width: 300, height, visibility: style.visibility }}>
            {suppressHeader !== true &&
            <FilterPanelHeader column={column} style={{ height: 25 }} onMouseDown={onMouseDown} />}
            <FlexBox className='filter-inner' style={{ flex: 1 }}>
                {suppressSearch !== true &&
                <SearchBar style={{ height: 25 }}
                    inputWidth={column.width - 16}
                    searchText={searchText}
                    onSearchText={handleSearchText}
                    selectionText={allSelected ? 'EXCLUDE ALL' : 'INCLUDE ALL'}
                    onClickSelectionText={clickHandler}
                    onHide={onClose} />}
                <CheckList style={{ flex: 1, margin: '3px 3px 0 3px', border: '1px solid lightgray' }}
                    columns={filterColumns}
                    dataView={filterView.current} />
                <FilterCounts style={{ height: 50 }} column={column} dataCounts={dataCounts} searchText={searchText} />
                {suppressFooter !== true &&
                <div key='footer' className='footer' style={{ height: 26 }}>
                    <button
                        className="toggle-zero-rows"
                        onClick={toggleZeroRows}>{showZeroRows ? 'Hide zero rows' : 'Show zero rows'}</button>
                    <button className='filter-done-button' onClick={onClose}>Done</button>
                </div>}
            </FlexBox>
        </FlexBox>
    );
}
