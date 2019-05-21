import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import Header from './header';
import ColumnFilter from './columnFilter';
import { filter as filterUtils } from '../../data'
import * as Action from '../model/actions';

const { STARTS_WITH } = filterUtils;

export default forwardRef(({ 
    dataView,
    dispatch,
    height,
    model,
    showFilter,
    style,
    onFilterOpen,
    onFilterClose
}, ref) => {

    const header = useRef(null);

    useImperativeHandle(ref, () => ({
        scrollLeft: pos => {
            header.current.scrollLeft(pos);
        }
    }))

    const handleFilter = (column, newFilter) => {
        //TODO move this into model
        const filter = filterUtils.addFilter(model.filter, newFilter);
        console.log(`
                add filter ${JSON.stringify(newFilter, null, 2)}
                to filter ${JSON.stringify(model.filter, null, 2)}
                creates new filter = ${JSON.stringify(filter, null, 2)}
            `)

        dataView.filter(filter);
        dispatch({ type: Action.FILTER, column, filter });

        if (newFilter.isNumeric) {
            // re-request the filterData, this will re-create bins on the filtered data
            const { key, name } = column.isGroup ? column.columns[0] : column;
            dataView.getFilterData({ key, name });
        }
    }

    const handleClearFilter = column => {
        const filter = filterUtils.removeFilterForColumn(model.filter, column);
        dataView.filter(filter);
        dispatch({ type: Action.FILTER, column, filter })
    }

    const handleKeyDown = (column, e) => {
        if (e.keyCode === 13) { // ENTER
            const value = e.target.value;
            handleFilter(column, { type: STARTS_WITH, colName: column.name, value })
        }
    }

    const handleSearchText = ({ key, name }, text) => {
        dataView.getFilterData({ key, name }, text);
    }

    // // This is being used to handle selection in a set filter, need to consider how it will work
    // // with regular row selection
    const handleSelection = (dataType, colName, filterMode) => {
        dataView.select(dataType, colName, filterMode);
    }

    const colHeaderRenderer = ({ key, column }) =>
        <ColumnFilter key={key}
            column={column}
            dataView={dataView}
            filter={model.filter}
            onKeyDown={handleKeyDown}
            onClearFilter={handleClearFilter}
            onFilterOpen={onFilterOpen}
            onFilterClose={onFilterClose}
            onSearchText={handleSearchText}
            showFilter={showFilter === column.name}
            onFilter={handleFilter}
            onSelect={handleSelection} />;

    return (
        <Header className='InlineFilter'
            ref={header}
            dispatch={dispatch}
            gridModel={model}
            height={height}
            style={style}
            colHeaderRenderer={colHeaderRenderer}
        />
    );

})