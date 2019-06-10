
import React, { useCallback, useEffect, useRef, useState } from 'react';
import cx from 'classnames';
import { filter as filterUtils, DataTypes } from '../../data';
import FilterView from '../../remote-data/view/filter-data-view';
import FlexBox from '../../inlay/flexBox';
import CheckList from './checkList';
import SearchBar from './filter-toolbar'
import './setFilter.css';
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

const FilterCounts = ({ column, dataCounts/*, searchText*/ }) => {
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

export const SetFilter = ({
    className,
    column,
    dataView,
    filter,
    height,
    onClose,
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

    }, [dataView])

    const toggleZeroRows = useCallback(() => {
        const showZero = !showZeroRows;
        setZeroRows(showZero);
        filterView.current.filter(showZero ? null : ZeroRowFilter);
    },[showZeroRows])

    // componentWillUnmount(){
    //     if (this.props.onHide){
    //         this.props.onHide();
    //     }
    //     const {filterView} = this.state;
    //     // filterView.removeListener(DataTypes.ROW_DATA, this.handleFilterViewUpdate);
    //     filterView.destroy();
    // }

    const handleSearchText = searchText => {
        searchText.current = searchText;
        filterView.current.getFilterData(column, searchText)
        // if we're removing searchtext to widen the search, we need to reevaluate the selectionDefault

    }

    const handleDeselectAll = () => {
        if (searchText.current) {
            filterView.current.filter({
                type: NOT_STARTS_WITH,
                colName: column.name,
                value: searchText.current
            }, DataTypes.ROW_DATA, true);
        } else {
            filterView.current.filter({
                type: IN,
                colName: column.name,
                values: []
            }, DataTypes.ROW_DATA, true);
        }
        setSelectionDefault(SELECT_NONE);
    }

    const handleSelectAll = () => {
        if (searchText.current) {
            filterView.current.filter({
                type: STARTS_WITH,
                colName: column.name,
                value: searchText.current
            }, DataTypes.ROW_DATA, true);
        } else {
            filterView.current.filter({
                type: NOT_IN,
                colName: column.name,
                values: []
            }, DataTypes.ROW_DATA, true);
        }
        setSelectionDefault(SELECT_ALL);
    }

    const allSelected = selectionDefault === SELECT_ALL;
    const clickHandler = allSelected ? handleDeselectAll : handleSelectAll;

    return (
        <FlexBox className={cx('SetFilter', 'ColumnFilter', className)} style={{ width: 300, height, visibility: style.visibility }}>
            {suppressHeader !== true &&
                <div className='col-header HeaderCell' style={{ height: 25 }}>
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
