//TODO where does this belong ? This is in ingrid too
import React from 'react';
import Cell from '@heswell/fingrid/src/core/cell';

const FormatRegistry = {};
const RegistryOfCellRenderers = {};

export default FormatRegistry;

const defaultFormatter = value => value == null ? '' : value + ' B';

export function registerFormatter(type, component){	
    FormatRegistry[type] = component;
}

export function registerRenderer(type, component){	
    RegistryOfCellRenderers[type] = component;
}

//TODO look at memoizing these calls
export function getFormatter(type){
    return FormatRegistry[type] ? FormatRegistry[type].formatter : defaultFormatter;
}

export function getCellRenderer(props){
    const type = props.column && props.column.type && props.column.type.renderer ? props.column.type.renderer.name : null; 
    if (type){
        const Type = RegistryOfCellRenderers[type];
        return <Type {...props} />;
    }
    else {
        return <Cell {...props}/>;
    }
}
