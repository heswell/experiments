// @ts-check
/** @typedef {import('./inline-filter').default} InlineFilter */

import React, { forwardRef, useRef, useCallback, useImperativeHandle, useState } from 'react';
import { filter as filterUtils, DataTypes } from '@heswell/data'
import Header from '../header.jsx';
import {ColumnFilter} from './column-filter.jsx';

import './inline-filter.css';

const { NOT_IN } = filterUtils;

/** @type {InlineFilter} */
const InlineFilter = forwardRef(({ 
    dataSource,
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

    const handleClearFilter = useCallback(column => {
        dataSource.filter({
            type: NOT_IN,
            colName: column.name,
            values: []
        }, DataTypes.ROW_DATA, true);
    },[]);

    const colHeaderRenderer = ({ key, column }) =>
        <ColumnFilter key={key}
            column={column}
            dataView={dataSource}
            // TODO we use this to mark the column as filtered 
            filter={serverFilter}
            onClearFilter={handleClearFilter}
            onFilterOpen={onFilterOpen}
            onFilterClose={onFilterClose}
            showFilter={showFilter === column.name}
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

export default InlineFilter;