import React from 'react';
import {FlexBox} from '@heswell/inlay';
import {FilterPanelHeader} from '../filter-panel-header';
import {SearchBar} from '../filter-toolbar/filter-toolbar.jsx';

import './filter-panel.css';

export const FilterPanel = ({
  children,
  column,
  style,
  showZeroRows,
  onHide,
  // onMouseDown is injected by Draggable, must be a better way to get this to FilterPanelGHeader - context ?
  onMouseDown,
  onSearch,
  toggleZeroRows
}) => {

    return (
      <FlexBox className="FilterPanel" style={style}>
        <FilterPanelHeader column={column} style={{ height: 25 }} onMouseDown={onMouseDown} />
        <FlexBox className='filter-inner' style={{ flex: 1 }}>
            <SearchBar style={{ height: 25 }}
                inputWidth={column.width - 16}
                // searchText={searchText}
                onSearchText={onSearch}
                onHide={onHide} />
            {children}
            <div key='footer' className='footer' style={{ height: 26 }}>
                <button
                    className="toggle-zero-rows"
                    onClick={toggleZeroRows}>{showZeroRows ? 'Hide zero rows' : 'Show zero rows'}</button>
                <button className='filter-done-button' onClick={onHide}>Done</button>
            </div>
        </FlexBox>
      </FlexBox>

    )
}