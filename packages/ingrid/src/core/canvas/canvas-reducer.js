import {PADDING_CELL} from '../row.jsx';

const VIRTUALIZATION_THRESHOLD = .66;

/** @type {CanvasReducerInitializer} */
export const init = ({gridModel, columnGroup}) => {
  const renderColumns = getRenderColumns(gridModel, columnGroup);  
  return [
    renderColumns,
    initialKeys(renderColumns)
  ];
};

/** @type {CanvasReducer} */
export default ([_, keys], action) => {
  if (action.type === 'scroll-threshold'){
    const {gridModel, columnGroup, scrollLeft} = action;
    const nextColumns = getRenderColumns(gridModel, columnGroup, scrollLeft);
    return [
      nextColumns,
      nextKeys(nextColumns, keys)
    ];
  } else {
    throw Error(`CanvasReducer does not recognize action ${action.type}`);
  }
}

function initialKeys(columns){
  return new Map(columns.map((column,idx) => [column.key, idx]));
}

function nextKeys(columns, prevKeys){

  if (columns.every(column => prevKeys.has(column.key))){
    console.log(`SURPRISED to be called with no change of keys !!!`)
    return prevKeys;
  } else {

    const remainingKeys = new Map(prevKeys);
    const nextKeys = new Map();
    const columnsAwaitingKeys = [];

    const nextKey = () => {
      const usedKeys = new Map(Array.from(initialKeys(columns).entries()).map(([k, v]) => [v,k]));
      
      nextKeys.forEach(value => {
        if (usedKeys.has(value)){
          usedKeys.delete(value);
        }
      });

      if (usedKeys.size > 0){
        return usedKeys.keys().next().value;
      } else {
        return columns.length;
      }
    }
  
    columns.forEach(column => {
      if (remainingKeys.has(column.key)){
        nextKeys.set(column.key, remainingKeys.get(column.key));
        remainingKeys.delete(column.key);
      } else {
        columnsAwaitingKeys.push(column.key)
      }
    });
  
    const freeKeys = Array.from(remainingKeys.values());
    columnsAwaitingKeys.forEach(columnKey => {
      nextKeys.set(columnKey, freeKeys.length ? freeKeys.shift(): nextKey());
    });

    return nextKeys;
  }
}

function getRenderColumns(gridModel, columnGroup, scrollLeft=0){

  if (!isVirtualizationRequired(gridModel, columnGroup)){
    return columnGroup.columns;
  }

  const {columns,renderWidth} = columnGroup;
  let firstIdx = -1;
  let lastIdx = columns.length - 1;
  let offset = 0;
  let defaultWidth = 200;

  for (let i=0, currentPosition=0;i<columns.length;i++){
    currentPosition += (columns[i].width || defaultWidth);
    if (currentPosition <= scrollLeft){
        offset += columns[i].width;
    } else if (currentPosition > scrollLeft + renderWidth){
        lastIdx = i;
        break;
    } else if (firstIdx === -1 && currentPosition > scrollLeft){
        firstIdx = i;
    }
  }
  return [{key: -1, name: PADDING_CELL, width: offset}, ...columns.slice(firstIdx, lastIdx + 1)];
}

const isVirtualizationRequired = ({displayWidth, totalColumnWidth}, {locked}) => {
  return !locked && displayWidth / totalColumnWidth < VIRTUALIZATION_THRESHOLD
}
