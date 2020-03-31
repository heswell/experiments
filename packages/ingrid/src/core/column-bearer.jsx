import React from 'react';
import Cell from '../cells/cell.jsx';
import GroupCell from '../cells/group-cell.jsx';
import HeaderCell from '../header/header-cell.jsx';

import './column-bearer.css';

const NULL_FORMATTER = () => {};

const ColumnBearer = (props) => {
    
    const {rows, gridModel} = props;
    const {_movingColumn: column, meta, headerHeight, _headingDepth: headingDepth} = gridModel

    const {left,width} = column;
    const top = (headingDepth - 1) * headerHeight; 
    console.log(`render ColumnBearer`)
    return (
        <div className='ColumnBearer' style={{top,left,width}}>
            <div className='Header' style={{height:headerHeight}}> 
                <HeaderCell column={column}/>
            </div>
            {
                rows.map((row,idx) => 
                    <div key={idx} className='Row'>
                        {
                            column.isGroup
                            ? <GroupCell key={idx} idx={idx} column={column} meta={meta} row={row} />
                            : <Cell key={idx} idx={idx} column={column} meta={meta} row={row} />

                        }
                    </div>
                )
            }
        </div>
    );
};

export default ColumnBearer;