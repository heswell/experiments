
export default (
  onScroll,
  onSelectionChange,
  onSelectCell,
  onDoubleClick

) => (state, action) => {
  const { type, ...props } = action;
  if (type === 'scroll') {
      onScroll && onScroll(props);
  } else if (type === 'selection') {
      const {idx, row, rangeSelect, keepExistingSelection} = action;
      onSelectionChange(idx, row, rangeSelect, keepExistingSelection);
  } else if (type === 'select-cell') {
      const { idx: rowIdx, columnKey } = action;
      onSelectCell && onSelectCell(rowIdx, columnKey);
  } else if (type === 'double-click') {
    const { idx, row } = action;
    onDoubleClick && onDoubleClick(idx, row);
  }
  return state;
}
