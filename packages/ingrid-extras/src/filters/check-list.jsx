// @ts-check
import React from 'react';
import {Grid, Selection} from '@heswell/ingrid';

import './check-list.css';

export default function CheckList({columns,dataSource,style}) {
    return (
    <Grid className='checkbox-list'
        showHeaders={{
            showColumnHeader: false,
            showSelectHeader: true
        }}
        rowHeight={22}
        minColumnWidth={80}
        columns={columns}
        selectionModel={Selection.Checkbox}
        style={style}
        dataSource={dataSource} />
    );


}
