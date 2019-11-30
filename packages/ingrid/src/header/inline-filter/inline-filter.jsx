import React, { forwardRef, useRef, useCallback, useImperativeHandle, useState } from 'react';
import { filter as filterUtils, DataTypes } from '@heswell/data'
import Header from '../header.jsx';
import {ColumnFilter} from './column-filter.jsx';

import './inline-filter.css';

const { NOT_IN } = filterUtils;

export default forwardRef(({ 
    // we should pass the dataView via context
    dataView,
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
        const { name } = column.isGroup ? column.columns[0] : column;
        if (showFilter !== name){
            setShowFilter(column.name);
        }
    }

    const onFilterClose = () => {
        setShowFilter(null);
    }

    // not used for setfilter any more
    const handleFilter = (column, newFilter) => {
        //TODO move this into model
        const filter = filterUtils.addFilter(serverFilter, newFilter);
        console.log(`
                add filter ${JSON.stringify(newFilter, null, 2)}
                to filter ${JSON.stringify(serverFilter, null, 2)}
                creates new filter = ${JSON.stringify(filter, null, 2)}
            `)

        dataView.filter(filter);

        if (newFilter.isNumeric) {
            // re-request the filterData, this will re-create bins on the filtered data
            const { key, name } = column.isGroup ? column.columns[0] : column;
            dataView.getFilterData({ key, name });
        }
    }

    const handleClearFilter = useCallback(column => {
        dataView.filter({
            type: NOT_IN,
            colName: column.name,
            values: []
        }, DataTypes.ROW_DATA, true);
    },[]);

    const colHeaderRenderer = ({ key, column }) =>
        <ColumnFilter key={key}
            column={column}
            dataView={dataView}
            // TODO we use this to mark the column as filtered 
            filter={serverFilter}
            onClearFilter={handleClearFilter}
            onFilterOpen={onFilterOpen}
            onFilterClose={onFilterClose}
            showFilter={showFilter === column.name}
            onFilter={handleFilter}
        />;

    return (
        <Header className='InlineFilter'
            ref={header}
            model={model}
            height={height}
            style={style}
            ignoreHeadings={true}
            colGroupHeaderRenderer={colHeaderRenderer}
            colHeaderRenderer={colHeaderRenderer}
        />
    );

})