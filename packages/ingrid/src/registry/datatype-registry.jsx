import * as React from 'react';
import Cell from '../cells/cell.jsx';
import CheckboxRenderer from '../cells/rendering/renderers/checkbox-cell.jsx';
import BackgroundCellRenderer from '../cells/rendering/renderers/background-cell.jsx';
import StringFormatter from '../cells/formatting/formatters/string-formatter';
import NumberFormatter from '../cells/formatting/formatters/number-formatter.jsx';
import GroupCell from '../cells/group-cell.jsx';

const FormatRegistry = {};
const RegistryOfCellRenderers = {};

export default FormatRegistry;

const defaultFormatter = {
    formatter: value => value == null ? '' : value,
    cellCSS : () => ''
};

export function registerFormatter(type, component){	
    FormatRegistry[type] = component;
}

export function registerRenderer(type, component){	
    RegistryOfCellRenderers[type] = component;
}

export function getFormatter(type=null){
    const t = type === null
        ? 'string'
        : typeof type === 'string' ? type : type.name;
         
    return FormatRegistry[t] ? FormatRegistry[t] : defaultFormatter;
}

// is getCellRenderer the most appropriate name here, as what we return is a
// JSX element, not a renderer
export function getCellRenderer(props){
    const {column} = props;
    const type = column && column.type && 
        (column.type.renderer 
            ? column.type.renderer.name 
            : column.type.name || null);
    let Type;

    if (type && (Type = RegistryOfCellRenderers[type])){
        return <Type {...props} />;
    } else if (column.isGroup) {
        return <GroupCell {...props}/>;
    } else {
        return <Cell {...props}/>;
    }
}

// register defaults
registerRenderer('selection-checkbox', CheckboxRenderer);
registerRenderer('background', BackgroundCellRenderer);
registerFormatter('number', NumberFormatter);
registerFormatter('string', StringFormatter);

