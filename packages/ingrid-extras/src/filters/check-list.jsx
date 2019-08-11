import React from 'react';
import {Grid, Selection} from '@heswell/ingrid';
import {filter} from '@heswell/data';

const {INCLUDE, EXCLUDE} = filter;

export default class CheckList extends React.Component {

    render(){
        return <Grid className='checkbox-list'
            debug_title={this.props.debug_title}
            showHeaders={false}
            rowHeight={22}
            minColumnWidth={80}
            columns={this.props.columns}
            selectionModel={Selection.Checkbox}
            height={this.props.height}
            width={this.props.width}
            style={this.props.style}
            dataView={this.props.dataView}
        />;
    }


}
