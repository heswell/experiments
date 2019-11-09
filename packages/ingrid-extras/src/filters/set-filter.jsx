
import React, { useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { filter as filterUtils, DataTypes, FilterDataView as FilterView } from '@heswell/data';
import {FlexBox} from '@heswell/inlay';

import CheckList from './check-list.jsx';
import SearchBar from './filter-toolbar.jsx'
import './set-filter.css';

const { 
    IN, NOT_IN, STARTS_WITH, NOT_STARTS_WITH, 
    SET_FILTER_DATA_COLUMNS
} = filterUtils;
const NO_STYLE = {}
const NO_COUNT = {}

const SET_FILTER_DATA_COLUMNS_NO_COUNT = SET_FILTER_DATA_COLUMNS.filter(col => col.name !== 'count');


export const INCLUDE = 'include';
export const EXCLUDE = 'exclude';

const SELECT_ALL = 'select-all';
const SELECT_NONE = 'select-none';

const {} = filterUtils;
const ZeroRowFilter = {
    colName: 'count',
    type: NOT_IN,
    values: [0]
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
    const [selectionDefault, setSelectionDefault] = useState(columnFilter && columnFilter.type === IN ? SELECT_NONE : SELECT_ALL);
    const filterView = useRef(new FilterView(dataView, column));
    const searchText = useRef('');

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
        setSelectionDefault(SELECT_NONE);
    },[column]);

    const handleSelectAll = useCallback(() => {
        if (searchText.current) {
            applyFilter(STARTS_WITH, searchText.current);
        } else {
            applyFilter(NOT_IN, undefined, []);
        }
        setSelectionDefault(SELECT_ALL);
    },[column]);

    const applyFilter = useCallback((type, value, values) => {
        filterView.current.filter({type, colName: column.name, value, values}, DataTypes.ROW_DATA, true);
    },[column])

    const allSelected = selectionDefault === SELECT_ALL;
    const clickHandler = allSelected ? handleDeselectAll : handleSelectAll;

    const handleMouseDown = e => {
        console.log('onMouseDown')
        onMouseDown(e)
    }

    console.log(`SetFilter render filter ${JSON.stringify(filter,null,2)}`)
    // somehow this needs to dispatch model-reducer if it's a change
    const filterColumns = filter === null || columnFilter === filter
        ? SET_FILTER_DATA_COLUMNS_NO_COUNT
        : SET_FILTER_DATA_COLUMNS

    // TODO envelope should be part of columnFilter
    return (
        <FlexBox className={cx('SetFilter', 'ColumnFilter', className)} style={{ width: 300, height, visibility: style.visibility }}>
            {suppressHeader !== true &&
                <div className='col-header HeaderCell' style={{ height: 25 }} onMouseDown={handleMouseDown}>
                    <div className='col-header-inner' style={{ width: column.width - 1 }}>{column.name}</div>
                </div>}
            <FlexBox className='filter-inner' style={{ flex: 1 }}>
                {suppressSearch !== true &&
                    <SearchBar style={{ height: 25 }}
                        inputWidth={column.width - 16}
                        searchText={searchText}
                        onSearchText={handleSearchText}
                        selectionText={allSelected ? 'DESELECT ALL' : 'SELECT ALL'}
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

function FilterCounts({ column, dataCounts/*, searchText*/ }) {
    const { dataRowTotal, dataRowAllFilters, filterRowTotal, filterRowSelected } = dataCounts;
    return (
        <div className="filter-count-section">
            <div className="filter-row-counts">
                <div>{`Distinct values for ${column.name}`}</div>
                <div className="filter-row-table">
                    <div>
                        <span>Selected</span>
                        <span>{filterRowSelected}</span>
                    </div>
                    <div>
                        <span>Total</span>
                        <span>{filterRowTotal}</span>
                    </div>
                </div>
            </div>
            <div className="data-row-counts">
                <div>{`Data records`}</div>
                <div className="filter-row-table">
                    {dataRowAllFilters < dataRowTotal ? (
                        <div>
                            <span>Filtered</span>
                            <span>{dataRowAllFilters}</span>
                        </div>

                    ) : (
                            <div>
                                <span>&nbsp;</span>
                                <span>&nbsp;</span>
                            </div>
                        )}
                    <div>
                        <span>Total</span>
                        <span>{dataRowTotal}</span>
                    </div>
                </div>

            </div>
        </div>
    )
}
