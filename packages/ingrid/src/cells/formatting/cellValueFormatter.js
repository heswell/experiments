import * as React from 'react';

const DEFAULT_TYPE = {name:'string'};

export function renderCellContent(props){

    const {column, row} = props;
    const {type=DEFAULT_TYPE, formatter} = column;
    const value = row[column.key];

    if (React.isValidElement(formatter)){
        return React.cloneElement(formatter, props);
    } else {
        return formatter(value, type, row); 
    }
}