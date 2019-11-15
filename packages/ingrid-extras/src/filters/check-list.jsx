import React from 'react';
import {Grid, Selection} from '@heswell/ingrid';

import './check-list.css';

export default class CheckList extends React.Component {

    render(){
        return <Grid className='checkbox-list'
            showHeaders={{
                columnHeader: true,
                selectHeader: true
            }}
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
