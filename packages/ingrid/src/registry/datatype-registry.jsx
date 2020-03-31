import CheckboxRenderer from '../cells/rendering/renderers/checkbox-cell.jsx';
import BackgroundCellRenderer from '../cells/rendering/renderers/background-cell.jsx';
import StringFormatter from '../cells/formatting/formatters/string-formatter';
import NumberFormatter from '../cells/formatting/formatters/number-formatter.jsx';

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
    const t = type 
        ? typeof type === 'string' ? type : type.name
        : 'string';
         
    return FormatRegistry[t] ? FormatRegistry[t] : defaultFormatter;
}

// is getCellRenderer the most appropriate name here, as what we return is a
// JSX element, not a renderer
export function getCellComponent(colType){

    const type = colType && 
        (colType.renderer 
            ? colType.renderer.name 
            : colType.name || null);

    return RegistryOfCellRenderers[type];
}

// register defaults
registerRenderer('selection-checkbox', CheckboxRenderer);
registerRenderer('background', BackgroundCellRenderer);
registerFormatter('number', NumberFormatter);
registerFormatter('string', StringFormatter);

