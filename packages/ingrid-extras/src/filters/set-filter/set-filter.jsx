
import React, { useState } from 'react';
import cx from 'classnames';
import { SET_FILTER_DATA_COLUMNS } from '@heswell/utils';
import {FlexBox} from '@heswell/layout';
import CheckList from '../check-list.jsx';
import {FilterCounts} from '../filter-counts.jsx';

import './set-filter.css';

const NO_STYLE = {}

const SET_FILTER_DATA_COLUMNS_NO_COUNT = SET_FILTER_DATA_COLUMNS.filter(col => col.name !== 'count');

export const SetFilter = ({
    className,
    column,
    dataSource: filterSource,
    filter,
    stats,
    style=NO_STYLE

}) => {

    console.log(`[SetFilter]`, stats)
    const columnFilter = filterUtils.extractFilterForColumn(filter, column.name);

    // somehow this needs to dispatch model-reducer if it's a change
    const filterColumns = filter === null || columnFilter === filter
        ? SET_FILTER_DATA_COLUMNS_NO_COUNT
        : SET_FILTER_DATA_COLUMNS

    return (
        <FlexBox className={cx('SetFilter', className)} style={{...style, flexDirection: 'column'}}>
            <CheckList style={{ flex: 1}}
                columns={filterColumns}
                dataSource={filterSource} />
            <FilterCounts style={{ height: 50 }} column={column} stats={stats} />
        </FlexBox>
    );
}
