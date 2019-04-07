import React from 'react';
import HeaderCell from '../header/header-cell';
import {getCellRenderer} from '../registry/dataTypeRegistry';

const NULL_FORMATTER = () => {};

const ColumnBearer = (props) => {
    
    const {rows, gridModel} = props;
    const {_movingColumn: column, meta, headerHeight, _headingDepth: headingDepth} = gridModel

    const {left,width} = column;
    const top = (headingDepth - 1) * headerHeight; 

    return (
        <div className='ColumnBearer' style={{top,left,width}}>
            <div className='Header' style={{height:headerHeight}}> 
                <HeaderCell column={column}/>
            </div>
            {
                rows.map((row,idx) => 
                    <div key={idx} className='Row'>
                        {getCellRenderer({
                            idx,
                            column,
                            meta,
                            formatter: column.formatter || NULL_FORMATTER,
                            row,
                            value:row[column.key]})}
                    </div>
                )
            }
        </div>
    );
};

export default ColumnBearer;