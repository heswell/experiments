
export default (
  onScroll,
  onSelectionChange,
  onSelectCell,
  onDoubleClick

) => (state, action) => {
  const { type, ...props } = action;
  console.log(`%cgridReducer ${type}`,'color:blue;font-weight: bold;')
  if (type === 'scroll') {
      onScroll && onScroll(props);
  } else if (type === 'selection') {
      const {idx, row, rangeSelect, keepExistingSelection} = action;
      onSelectionChange(idx, row, rangeSelect, keepExistingSelection);
  } else if (type === 'select-cell') {
      const { idx: rowIdx, cellIdx } = action;
      onSelectCell && onSelectCell(rowIdx, cellIdx);
  } else if (type === 'double-click') {
    const { idx, row } = action;
    onDoubleClick && onDoubleClick(idx, row);
  }
  return state;
}
