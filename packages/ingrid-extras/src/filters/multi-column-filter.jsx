import React from 'react';
import {FlexBox, TabbedContainer} from '@heswell/inlay';
import {SetFilter} from './set-filter/set-filter.jsx'
// import {NumberFilter} from './numberFilter'
import './multi-column-filter.css'

import cx from 'classnames';

export class MultiColumnFilter extends React.Component{

    render(){
        console.log(`RENDER MULTI COLUMN FILTER`)
        const {column, className, height, width, dataView, onSelectionChange} = this.props;
        const {columns, width: columnWidth} = column;
        return (
            <FlexBox className={cx('MultiColumnFilter','FilterPanel', className)} style={{width,height}}>
                <div className='column-selector' style={{height: 0}}></div>
                <TabbedContainer className='tabbed-filters' style={{flex: 1}} tabstripHeight={25} onTabSelectionChanged={idx => this.handleSwitchFilter(idx)}>
                    {columns.map((column,i) =>
                        <SetFilter key={i}
                            title={column.name}
                            dataView={dataView}
                            column={{...column, width: columnWidth}}
                            width={width}
                            height={height}
                            suppressHeader={true}
                            suppressFooter={true}
                            onSearchText={this.props.onSearchText}
                            onSelectionChange={(selected, filterMode) =>
                                onSelectionChange(selected, filterMode, column)}/>
                    )}
                </TabbedContainer>
                <div className='footer' style={{height: 24, backgroundColor: 'red'}}>
                    <button className='filter-done-button' onClick={this.props.onClose}>Done</button>
                </div>
            </FlexBox>
        );
    }

    handleSwitchFilter(idx){
        const column = this.props.column.columns[idx];
        console.log(`switching column to ${JSON.stringify(column)}`)
        this.props.dataView.getFilterData(column);
    }

    componentWillUnmount(){
        if (this.props.onHide){
            this.props.onHide();
        }
    }
}
