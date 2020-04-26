/** @type {GridReducerFactory}} */
export default handlerMap => (state, action) => {
  
  if (handlerMap[action.type]){
    switch (action.type){

      case 'scroll-start-horizontal':
        console.log('dfjkdjfdkjfkdfjkfjdfj')
        handlerMap[action.type]();
        break;

      case 'scroll-end-horizontal':
        handlerMap[action.type](action.scrollLeft);
        break;

      case 'double-click':
        handlerMap[action.type](action.idx, action.row);
        break;

      case 'selection': {
          const {idx, row, rangeSelect, keepExistingSelection} = action;
          handlerMap[action.type](idx, row, rangeSelect, keepExistingSelection);
        }
        break;

      case 'select-cell':
        handlerMap[action.type](action.idx, action.columnKey);
        break;

    }
  }
  return state;
}
