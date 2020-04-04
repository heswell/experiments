/** @typedef {import('./column-filter').ColumnFilterComponent} ColumnFilter */
import React, { useRef, useEffect, useCallback, useState } from 'react';
import cx from 'classnames';
import { 
    columnUtils,
    DataTypes,
    filter as filterUtils
} from '@heswell/data';

import dataSourceFactory from './data-source-factory';

import {
    FilterType,
    SetFilter,
    NumberFilter,
    MultiColumnFilter,
    FilterPanel
} from '@heswell/ingrid-extras';

import Draggable from '../../draggable/draggable.jsx';
import { PopupService } from '@heswell/ui-controls';

import './column-filter.css';

const {includesColumn, STARTS_WITH} = filterUtils;


const NO_COUNT = {}

//TODO do we nedd to tear down the filterView ?
/** @type {ColumnFilter} */
const ColumnFilter =  ({
    column,
    dataView,
    filter,
    onClearFilter,
    onFilterOpen,
    onFilterClose,
    showFilter
}) => {

    const [filterType] = useState(columnUtils.getFilterType(column)); 
    const [stats, setStats] = useState(NO_COUNT);
    const onDataCount = (_, stats) => {
        console.log(`setStats`, stats)
        setStats(stats);
    }
    const filterView = useRef(dataSourceFactory(dataView, filterType, column, onDataCount));
    const rootEl = useRef(null);
    console.log(`ColumnFilter ${JSON.stringify(filter,null,2)}`)
    const toggleFilterDisplay = () => {
        onFilterOpen(column);
    }

    // close filter is a user action
    const closeFilter = () => {
        PopupService.hidePopup();
    }

    // hide fires when the filter has been closed
    const hideFilter = useCallback(() => {
        setTimeout(() => {
            // needs delay to ensure firing after ColumnFilter is rerendered with new 
            // clickhandler which would otherwise immediately re-open filter.
            onFilterClose();
        }, 50);
    },[]);

    const handleKeyDown = useCallback(e => {
        if (e.keyCode === 13) { // ENTER
            dataView.filter({
                 type: STARTS_WITH,
                 colName: column.name,
                 value: e.target.value
            })
        }
    },[]);

    const clearFilter = useCallback(() => {
        onClearFilter(column);
    },[])

    const handleFilter = (/*filter*/) => {
        // Do we still need - see Numberfilter and group
    }

    useEffect(() => {
        if (showFilter){
            const component = getFilter();
            const el = rootEl.current;
            const { left, top } = el.getBoundingClientRect();
            // TODO without the timeout, it does not render until next render cycle
            requestAnimationFrame(() => {
                PopupService.showPopup({ left: Math.round(left), top: top - 26, component });
            })
        }
    },[showFilter, filter, stats]);

    const moveFilter = (e, deltaX, deltaY) => {
        console.log(`move Filter by ${deltaX} ${deltaY}`)
        PopupService.movePopup(deltaX, deltaY);
    }

    const handleSearchText = value => {
        filterView.current.filter({type: STARTS_WITH, colName: 'name', value}, DataTypes.FILTER_DATA, true);
    }

    // on unmount only ...
    useEffect(() => closeFilter, []);

    const getFilter = () => {
        // TODO how do we wire up the onMouseDown
        const childFilter = getFilterBody();
        return (
            <Draggable onDrag={moveFilter}>
                <FilterPanel 
                    column={column}
                    style={{width: 300, height: 350}} 
                    onHide={closeFilter}
                    onSearch={handleSearchText}>
                    {childFilter}
                </FilterPanel>
            </Draggable>

        )
    }

    const getFilterBody = () => {
        if (!column.isGroup || column.columns.length === 1) {
            switch (filterType) {
                case FilterType.Number:
                    return (
                        <NumberFilter
                            column={column}
                            style={{flex:1}}
                            dataView={filterView.current}
                            filter={filter}
                            onHide={hideFilter} />
                    );
                default:
                    return (
                        <SetFilter
                            style={{flex:1}}
                            column={column}
                            filter={filter}
                            dataSource={filterView.current}
                            stats={stats} />
                    );
            }

        } else {
            return <MultiColumnFilter
                column={column}
                height={261}
                width={300}
                filter={filter}
                dataView={dataView}
                onHide={hideFilter}
                onClose={closeFilter}
                onApplyFilter={handleFilter}
            />;
        }
       
    }

    const isActive = includesColumn(filter, column);
    const className = cx('HeaderCell', { 'filter-active': isActive, 'filter-showing': showFilter });

    return (
        // we only need care about opening the filter - the Popup service will close if for us.
        <div ref={rootEl} className={className} style={{ padding: 0, width: column.width }}>
            <div className='filter-button' onClick={toggleFilterDisplay}>
                <i className="material-icons">filter_list</i>
            </div>
            <div className="filter-input-container">
                <input className="filter-input" type='text' onKeyDown={handleKeyDown} />
            </div>
            {isActive &&
                <div className='filter-clear-button' onClick={clearFilter}>
                    <i className="material-icons">cancel</i>
                </div>}
        </div>
    );
}

export default ColumnFilter;