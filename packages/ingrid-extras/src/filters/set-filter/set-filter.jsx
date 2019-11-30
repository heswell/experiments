
import React, { useState } from 'react';
import cx from 'classnames';
import { filter as filterUtils } from '@heswell/data';
import {FlexBox} from '@heswell/inlay';

import CheckList from '../check-list.jsx';
import {FilterCounts} from '../filter-counts.jsx';
import './set-filter.css';

const { 
    SET_FILTER_DATA_COLUMNS
} = filterUtils;

const NO_STYLE = {}

const SET_FILTER_DATA_COLUMNS_NO_COUNT = SET_FILTER_DATA_COLUMNS.filter(col => col.name !== 'count');

export const SetFilter = ({
    className,
    column,
    dataView: filterView,
    filter,
    stats,
    style=NO_STYLE

}) => {

    const columnFilter = filterUtils.extractFilterForColumn(filter, column.name);

    // somehow this needs to dispatch model-reducer if it's a change
    const filterColumns = filter === null || columnFilter === filter
        ? SET_FILTER_DATA_COLUMNS_NO_COUNT
        : SET_FILTER_DATA_COLUMNS

    return (
        <FlexBox className={cx('SetFilter', className)} style={style}>
            <CheckList style={{ flex: 1, border: '1px solid lightgray' }}
                columns={filterColumns}
                dataView={filterView} />
            <FilterCounts style={{ height: 50 }} column={column} stats={stats} />
        </FlexBox>
    );
}
