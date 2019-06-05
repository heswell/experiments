import React, { forwardRef, useRef, useImperativeHandle, useState } from 'react';
import Header from './header';
import ColumnFilter from './columnFilter';
import { filter as filterUtils, DataTypes } from '../../data'
import * as Action from '../model/actions';

const { STARTS_WITH, NOT_IN } = filterUtils;

export default forwardRef(({ 
    dataView,
    dispatch,
    height,
    model,
    filter: serverFilter,
    style
}, ref) => {

    const header = useRef(null);
    const [showFilter, setShowFilter] = useState(null);

    useImperativeHandle(ref, () => ({
        scrollLeft: pos => {
            header.current.scrollLeft(pos);
        }
    }))

    const onFilterOpen = column => {
        const { key, name } = column.isGroup ? column.columns[0] : column;
        if (showFilter !== name){
            dataView.getFilterData({
                key, name
            });
            setShowFilter(column.name);
        }
    }

    const onFilterClose = () => {
        setShowFilter(null);
        // I think we're doing this so that if same filter is opened again, dataView sends rows
        dataView.setFilterRange(0, 0);
    }

    const handleFilter = (column, newFilter) => {

        //TODO move this into model
        const filter = filterUtils.addFilter(serverFilter, newFilter);
        console.log(`
                add filter ${JSON.stringify(newFilter, null, 2)}
                to filter ${JSON.stringify(serverFilter, null, 2)}
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
        dataView.filter({
            type: NOT_IN,
            colName: column.name,
            values: []
        }, DataTypes.ROW_DATA, true);
        // const filter = filterUtils.removeFilterForColumn(serverFilter, column);
        // dataView.filter(filter);
        // dispatch({ type: Action.FILTER, column, filter })
    }

    const handleKeyDown = (column, e) => {
        if (e.keyCode === 13) { // ENTER
            const value = e.target.value;
            handleFilter(column, { type: STARTS_WITH, colName: column.name, value })
        }
    }

    const colHeaderRenderer = ({ key, column }) =>
        <ColumnFilter key={key}
            column={column}
            dataView={dataView}
            // TODO we use this to mark the column as filtered 
            filter={serverFilter}
            onKeyDown={handleKeyDown}
            onClearFilter={handleClearFilter}
            onFilterOpen={onFilterOpen}
            onFilterClose={onFilterClose}
            showFilter={showFilter === column.name}
            onFilter={handleFilter}
        />;

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