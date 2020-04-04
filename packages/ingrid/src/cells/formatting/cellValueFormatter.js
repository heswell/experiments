/** 
 * @typedef {import('./cellValueFormatter').CellValueFormatter} CellValueFormatter
 */

import {getFormatter} from '../../registry/datatype-registry.jsx';

const DEFAULT_TYPE = {name:'string'};

 /** @type {CellValueFormatter} */
 export function renderCellContent(props){
    const {column, row} = props;
    const {type=DEFAULT_TYPE} = column;

    // very expensive to do this at this level
    const {formatter} = getFormatter(type);

    const value = row[column.key];

    return formatter(value, type, row); 
}