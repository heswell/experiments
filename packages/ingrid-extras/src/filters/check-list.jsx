import React from 'react';
import {Grid, Selection} from '@heswell/ingrid';

import './check-list.css';

export default function CheckList({columns,dataView,style}) {
    return (
    <Grid className='checkbox-list'
        showHeaders={{
            columnHeader: true,
            selectHeader: true
        }}
        rowHeight={22}
        minColumnWidth={80}
        columns={columns}
        selectionModel={Selection.Checkbox}
        style={style}
        dataView={dataView} />
    );


}
