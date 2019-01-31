import React from 'react';
import {Grid, Selection} from '@heswell/fingrid';
import './simpleList.css';

const COLUMNS = [{name: 'label', type: 'string'}];

export default class SimpleList extends React.Component {
    render(){
        const data = this.props.data.map(d => ({label: d}))
        return <Grid className='simple-list'
            showHeaders={false}
            rowHeight={22}
            minColumnWidth={80}
            columns={COLUMNS}
            selectionModel={Selection.SingleRow}
            defaultSelected={this.props.defaultSelected}
            height={this.props.height}
            width={this.props.width}
            data={data}
            onSelectionChange={this.handleSelection}

        />;
    }

    handleSelection = (selection, idx) => {
        this.props.onSelectionChange(this.props.data[idx]);
    }
}
