
import React, { useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { filter as filterUtils, DataTypes } from '../../data';
import FilterView from '../../remote-data/view/filter-data-view';
import FlexBox from '../../inlay/flexBox';
import CheckList from './checkList';
import SearchBar from './filter-toolbar'
import './set-filter.css';
import { NOT_IN, STARTS_WITH, NOT_STARTS_WITH, SET_FILTER_DATA_COLUMNS as filterColumns } from '../../data/store/filter';

const { IN } = filterUtils;
const NO_STYLE = {}
const NO_COUNT = {}

export const INCLUDE = 'include';
export const EXCLUDE = 'exclude';

const SELECT_ALL = 'select-all';
const SELECT_NONE = 'select-none';

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
        filterView.current.on('data-count', setDataCounts);
        return () => {
            filterView.current.removeListener('data-count', setDataCounts);
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
        filterView.current.selectNone();
    },[column]);

    const handleSelectAll = useCallback(() => {
        filterView.current.selectAll();
        // if (searchText.current) {
        //     applyFilter(STARTS_WITH, searchText.current);
        // } else {
        //     applyFilter(NOT_IN, undefined, []);
        // }
        // setSelectionDefault(SELECT_ALL);
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
