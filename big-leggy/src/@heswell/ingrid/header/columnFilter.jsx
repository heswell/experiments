import React, { useRef, useEffect, useCallback } from 'react';
import cx from 'classnames';
import Draggable from '../draggable/draggable';

import { SetFilter, NumberFilter, MultiColumnFilter } from '../../ingrid-extras';
import { columnUtils, filter as filterUtils } from '../../data';
import { PopupService } from '../services';

export default ({
    column,
    dataView,
    filter,
    onClearFilter,
    onFilterOpen,
    onFilterClose,
    showFilter,
    onFilter
}) => {

    const rootEl = useRef(null);

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
                 type: filterUtils.STARTS_WITH,
                 colName: column.name,
                 value: e.target.value
            })
        }
    },[]);

    const clearFilter = useCallback(() => {
        onClearFilter(column);
    },[])

    const handleNumberFilterChange = (column, filter) => {
        onFilter(column, filter);
    }

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
    },[showFilter]);

    const moveFilter = (e, deltaX, deltaY) => {
        console.log(`move Filter by ${deltaX} ${deltaY}`)
        PopupService.movePopup(deltaX, deltaY);
    }

    const getFilter = () => {
        console.log(`getFilter ${JSON.stringify(column)}`)
        if (!column.isGroup || column.columns.length === 1) {
            switch (columnUtils.getFilterType(column)) {
                case 'number':
                    return (
                        <NumberFilter column={column} height={250}
                            className='FilterPanel'
                            dataView={dataView}
                            filter={filter}
                            onHide={hideFilter}
                            onClose={closeFilter}
                            onApplyFilter={handleNumberFilterChange} />
                    );
                default:
                    return (
                        <Draggable onDrag={moveFilter}>
                            <SetFilter className='FilterPanel'
                                column={column}
                                filter={filter}
                                height={350}
                                width={column.width + 120}
                                dataView={dataView}
                                onHide={hideFilter}
                                onClose={closeFilter}
                            />
                        </Draggable>
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

    const isActive = filterUtils.includesColumn(filter, column);
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
