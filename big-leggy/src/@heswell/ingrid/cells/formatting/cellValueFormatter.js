import * as React from 'react';

const DEFAULT_TYPE = {name:'string'};

export function renderCellContent(props){

    const {column, value, row, formatter} = props;
    const {type=DEFAULT_TYPE} = column;

    if (React.isValidElement(formatter)){
        return React.cloneElement(formatter, props);
    } else {
        return formatter(value, type, row); 
    }
}